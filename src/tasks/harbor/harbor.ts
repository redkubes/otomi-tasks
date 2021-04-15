/* eslint-disable @typescript-eslint/camelcase */
import {
  ConfigureApi,
  HttpError,
  MemberApi,
  HttpBearerAuth,
  ProjectApi,
  ProjectMember,
  ProjectReq,
  RobotApi,
  Project,
} from '@redkubes/harbor-client-node'
import http from 'http'
import {
  cleanEnv,
  HARBOR_BASE_URL,
  HARBOR_PASSWORD,
  HARBOR_USER,
  OIDC_CLIENT_SECRET,
  OIDC_ENDPOINT,
  OIDC_VERIFY_CERT,
  TEAM_NAMES,
} from '../../validators'
import { createSecret, ensure, getApiClient, getSecret } from '../../utils'

const env = cleanEnv({
  HARBOR_BASE_URL,
  HARBOR_PASSWORD,
  HARBOR_USER,
  OIDC_CLIENT_SECRET,
  OIDC_ENDPOINT,
  OIDC_VERIFY_CERT,
  TEAM_NAMES,
})

const HarborRole = {
  admin: 1,
  developer: 2,
  guest: 3,
  master: 4,
}

const HarborGroupType = {
  ldap: 1,
  http: 2,
}

const errors: string[] = []
type asyncFn = {
  response: http.IncomingMessage
  body?: any
}

export interface RobotSecret {
  id: number
  name: string
  secret: string
}

const robot: any = {
  name: 'harbor',
  duration: 0,
  description: 'Used by Otomi Harbor task runner',
  disable: false,
  level: 'system',
  permissions: [
    {
      kind: 'system',
      namespace: '/',
      access: [
        {
          resource: '*',
          action: '*',
        },
      ],
    },
  ],
}

const config: any = {
  auth_mode: 'oidc_auth',
  oidc_admin_group: 'admin',
  oidc_client_id: 'otomi',
  oidc_client_secret: env.OIDC_CLIENT_SECRET,
  oidc_endpoint: env.OIDC_ENDPOINT,
  oidc_groups_claim: 'groups',
  oidc_name: 'otomi',
  oidc_scope: 'openid',
  oidc_verify_cert: env.OIDC_VERIFY_CERT,
  self_registration: false,
}

const namespace = 'harbor'
const secretName = 'harbor-robot-admin'
const bearerAuth: HttpBearerAuth = new HttpBearerAuth()
const robotApi = new RobotApi(env.HARBOR_USER, env.HARBOR_PASSWORD, env.HARBOR_BASE_URL)
const configureApi = new ConfigureApi(env.HARBOR_USER, env.HARBOR_PASSWORD, env.HARBOR_BASE_URL)
const projectsApi = new ProjectApi(env.HARBOR_USER, env.HARBOR_PASSWORD, env.HARBOR_BASE_URL)
const memberApi = new MemberApi(env.HARBOR_USER, env.HARBOR_PASSWORD, env.HARBOR_BASE_URL)

function setAuth(secret) {
  bearerAuth.accessToken = secret
  robotApi.setDefaultAuthentication(bearerAuth)
}

async function doApiCall(action: string, fn: () => Promise<asyncFn>): Promise<any | undefined> {
  console.info(`Running '${action}'`)
  try {
    const res = await fn()
    console.info(`Successful '${action}'`)
    return res?.body
  } catch (e) {
    if (e instanceof HttpError) {
      if (e.statusCode === 409) console.warn(`${action}: already exists.`)
      else errors.push(`${action} > HTTP error ${e.statusCode}: ${e.message}`)
    } else errors.push(`${action} > Error processing '${action}': ${e}`)
    return undefined
  }
}

// NOTE: assumes OIDC is not yet configured, otherwise this operation is NOT possible
async function createRobotSecret(): Promise<RobotSecret> {
  const robotList = await doApiCall(`Reading list of robot accounts`, () => robotApi.listRobot())
  const existing = robotList.find((i) => i.name === `robot$${robot.name}`)
  if (existing) {
    const existingId = existing.id
    await doApiCall(`Deleting previous robot account ${robot.name}`, () => robotApi.deleteRobot(existingId))
  }
  const res = await doApiCall(`Create robot account ${robot.name} with system level perms`, () =>
    robotApi.createRobot(robot),
  )
  const { id, name, secret } = res
  const robotSecret: RobotSecret = { id, name, secret }
  await createSecret(secretName, namespace, robotSecret)
  return robotSecret
}

async function ensureSecret(): Promise<RobotSecret> {
  let robotSecret = (await getSecret(secretName, namespace)) as RobotSecret
  if (!robotSecret) {
    // not existing yet, create robot account and keep creds in secret
    robotSecret = await createRobotSecret()
  } else {
    // test if secret still works
    try {
      setAuth(robotSecret.secret)
      robotApi.listRobot()
    } catch (e) {
      // throw everything expect 401, which is what we test for
      if (e.status !== 401) throw e
      // unauthenticated, so remove and recreate secret
      await getApiClient().deleteNamespacedSecret(secretName, namespace)
      // now, the next call might throw IF:
      // - authMode oidc was already turned on and an otomi admin accidentally removed the secret
      // but that is very unlikely, an unresolvable problem and needs a manual db fix
      robotSecret = await createRobotSecret()
    }
  }
  setAuth(robotSecret.secret)
  return robotSecret
}

async function main(): Promise<void> {
  await ensureSecret()

  // now we can set the token on our apis
  // too bad we can't set it globally
  configureApi.setDefaultAuthentication(bearerAuth)
  projectsApi.setDefaultAuthentication(bearerAuth)
  memberApi.setDefaultAuthentication(bearerAuth)

  await doApiCall('Harbor configuration', () => configureApi.configurationsPut(config))
  await Promise.all(
    env.TEAM_NAMES.map(async (team) => {
      const projectReq: ProjectReq = {
        projectName: team,
      }
      await doApiCall(`Create project for team ${team}`, async () => projectsApi.createProject(projectReq))
      const project = (await doApiCall(`Get project for team ${team}`, async () =>
        projectsApi.getProject(team),
      )) as Project

      if (!project) return
      const projectId = `${ensure(project.projectId)}`

      const projMember: ProjectMember = {
        roleId: HarborRole.developer,
        memberGroup: {
          groupName: team,
          groupType: HarborGroupType.http,
        },
      }
      const projAdminMember: ProjectMember = {
        roleId: HarborRole.admin,
        memberGroup: {
          groupName: 'team-admin',
          groupType: HarborGroupType.http,
        },
      }
      await doApiCall(`Associating "developer" role for team "${team}" with harbor project "${team}"`, () =>
        memberApi.createProjectMember(projectId, undefined, undefined, projMember),
      )
      await doApiCall(`Associating "project-admin" role for "team-admin" with harbor project "${team}"`, () =>
        memberApi.createProjectMember(projectId, undefined, undefined, projAdminMember),
      )
    }),
  )

  if (errors.length) {
    console.error(`Errors found: ${JSON.stringify(errors, null, 2)}`)
    process.exit(1)
  } else {
    console.info('Success!')
  }
}
// Run main only on execution, not on import (like tests)
if (typeof require !== 'undefined' && require.main === module) {
  main()
}
