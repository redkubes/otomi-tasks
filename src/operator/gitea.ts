import Operator, { ResourceEventType } from '@dot-i/k8s-operator'
import * as k8s from '@kubernetes/client-node'
import stream from 'stream'

import {
  CreateHookOption,
  CreateOrgOption,
  CreateRepoOption,
  CreateTeamOption,
  EditRepoOption,
  OrganizationApi,
  Repository,
  RepositoryApi,
  Team,
} from '@redkubes/gitea-client-node'
import { doApiCall, waitTillAvailable } from '../utils'
import { orgName, otomiChartsRepoName, otomiValuesRepoName, teamNameViewer, username } from './common'

// Interfaces
interface hookInfo {
  id?: number
  hasHook: boolean
}

interface groupMapping {
  [key: string]: {
    otomi: string[]
  }
}

const errors: string[] = []

const readOnlyTeam: CreateTeamOption = {
  ...new CreateTeamOption(),
  canCreateOrgRepo: false,
  name: teamNameViewer,
  includesAllRepositories: false,
  permission: CreateTeamOption.PermissionEnum.Read,
  units: ['repo.code'],
}

const editorTeam: CreateTeamOption = {
  ...readOnlyTeam,
  includesAllRepositories: false,
  permission: CreateTeamOption.PermissionEnum.Write,
}

const adminTeam: CreateTeamOption = { ...editorTeam, permission: CreateTeamOption.PermissionEnum.Admin }

const kc = new k8s.KubeConfig()
// loadFromCluster when deploying on cluster
// loadFromDefault when locally connecting to cluster
kc.loadFromDefault()
const k8sApi = kc.makeApiClient(k8s.CoreV1Api)
const watch = new k8s.Watch(kc)

// Setup Gitea
async function upsertTeam(
  existingTeams: Team[] = [],
  orgApi: OrganizationApi,
  teamOption: CreateTeamOption,
): Promise<void> {
  const existingTeam = existingTeams.find((el) => el.name === teamOption.name)
  if (existingTeam)
    return doApiCall(
      errors,
      `Updating team "${teamOption.name}" in org "${orgName}"`,
      () => orgApi.orgEditTeam(existingTeam.id!, teamOption),
      422,
    )
  return doApiCall(
    errors,
    `Updating team "${teamOption.name}" in org "${orgName}"`,
    () => orgApi.orgCreateTeam(orgName, teamOption),
    422,
  )
}

async function upsertRepo(
  existingTeams: Team[] = [],
  existingRepos: Repository[] = [],
  orgApi: OrganizationApi,
  repoApi: RepositoryApi,
  repoOption: CreateRepoOption | EditRepoOption,
  teamName?: string,
): Promise<void> {
  const existingRepo = existingRepos.find((el) => el.name === repoOption.name)
  if (!existingRepo) {
    // org repo create
    await doApiCall(
      errors,
      `Creating repo "${repoOption.name}" in org "${orgName}"`,
      () => orgApi.createOrgRepo(orgName, repoOption as CreateRepoOption),
      422,
    )
  } else {
    // repo update
    await doApiCall(
      errors,
      `Updating repo "${repoOption.name}" in org "${orgName}"`,
      () => repoApi.repoEdit(orgName, repoOption.name!, repoOption as EditRepoOption),
      422,
    )
  }
  // new team repo, add team
  if (teamName)
    await doApiCall(
      errors,
      `Adding repo "${repoOption.name}" to team "${teamName}"`,
      () => repoApi.repoAddTeam(orgName, repoOption.name!, teamName),
      422,
    )
  return undefined
}

async function hasSpecificHook(repoApi: RepositoryApi, hookToFind: string): Promise<hookInfo> {
  const hooks: any[] = await doApiCall(
    errors,
    `Getting hooks in repo "otomi/values"`,
    () => repoApi.repoListHooks(orgName, 'values'),
    400,
  )
  if (!hooks) {
    console.debug(`No hooks were found in repo "values"`)
    return { hasHook: false }
  }

  const foundHook = hooks.find((hook) => {
    return hook.config && hook.config.url.includes(hookToFind)
  })
  if (foundHook) {
    console.debug(`Hook (${hookToFind}) exists in repo "values"`)
    return { id: foundHook.id, hasHook: true }
  }
  console.debug(`Hook (${hookToFind}) not found in repo "values"`)
  return { hasHook: false }
}

async function addTektonHook(repoApi: RepositoryApi): Promise<void> {
  console.debug('Check for Tekton hook')
  const clusterIP = 'http://el-otomi-tekton-listener.otomi-pipelines.svc.cluster.local:8080'
  const hasTektonHook = await hasSpecificHook(repoApi, 'el-otomi-tekton-listener')
  if (!hasTektonHook.hasHook) {
    console.debug('Tekton Hook needs to be created')
    await doApiCall(
      errors,
      `Adding hook "tekton" to repo otomi/values`,
      () =>
        repoApi.repoCreateHook(orgName, 'values', {
          type: CreateHookOption.TypeEnum.Gitea,
          active: true,
          config: {
            url: clusterIP,
            http_method: 'post',
            content_type: 'json',
          },
          events: ['push'],
        } as CreateHookOption),
      304,
    )
  }
}

async function createOrgAndTeams(orgApi: OrganizationApi, existingTeams: Team[], teamIds: string[], TEAM_CONFIG: any) {
  const orgOption = { ...new CreateOrgOption(), username: orgName, repoAdminChangeTeamAccess: true }
  await doApiCall(errors, `Creating org "${orgName}"`, () => orgApi.orgCreate(orgOption), 422)

  // create all the teams first
  await Promise.all(
    teamIds.map((teamId) => {
      // determine self service flags
      const name = `team-${teamId}`
      if ((TEAM_CONFIG[teamId]?.selfService?.apps || []).includes('gitea'))
        return upsertTeam(existingTeams, orgApi, { ...adminTeam, name })
      return upsertTeam(existingTeams, orgApi, { ...editorTeam, name })
    }),
  )
  // create org wide viewer team for otomi role "team-viewer"
  await upsertTeam(existingTeams, orgApi, readOnlyTeam)
}

async function createReposAndAddToTeam(
  orgApi: OrganizationApi,
  repoApi: RepositoryApi,
  existingTeams: Team[],
  existingRepos: Repository[],
  repoOption: CreateRepoOption,
) {
  // create main org repo: otomi/values
  await upsertRepo(existingTeams, existingRepos, orgApi, repoApi, repoOption)
  // create otomi/charts repo for auto image updates
  await upsertRepo(existingTeams, existingRepos, orgApi, repoApi, { ...repoOption, name: otomiChartsRepoName })

  // add repo: otomi/values to the team: otomi-viewer
  await doApiCall(
    errors,
    `Adding repo ${otomiValuesRepoName} to team ${teamNameViewer}`,
    () => repoApi.repoAddTeam(orgName, otomiValuesRepoName, teamNameViewer),
    422,
  )

  // add repo: otomi/charts to the team: otomi-viewer
  await doApiCall(
    errors,
    `Adding repo ${otomiChartsRepoName} to team ${teamNameViewer}`,
    () => repoApi.repoAddTeam(orgName, otomiChartsRepoName, teamNameViewer),
    422,
  )
}

async function setupGitea(GITEA_PASSWORD: string, GITEA_URL: string, TEAM_CONFIG: any, hasArgocd: boolean) {
  const teamIds = Object.keys(TEAM_CONFIG)
  await waitTillAvailable(GITEA_URL)
  const giteaUrl: string = GITEA_URL.endsWith('/') ? GITEA_URL.slice(0, -1) : GITEA_URL

  // create the org
  const orgApi = new OrganizationApi(username, GITEA_PASSWORD, `${giteaUrl}/api/v1`)
  const repoApi = new RepositoryApi(username, GITEA_PASSWORD, `${giteaUrl}/api/v1`)

  const existingTeams = await doApiCall(errors, `Getting all teams in org "${orgName}"`, () =>
    orgApi.orgListTeams(orgName),
  )
  await createOrgAndTeams(orgApi, existingTeams, teamIds, TEAM_CONFIG)

  const existingRepos = await doApiCall(errors, `Getting all repos in org "${orgName}"`, () =>
    orgApi.orgListRepos(orgName),
  )
  const repoOption: CreateRepoOption = {
    ...new CreateRepoOption(),
    autoInit: false,
    name: otomiValuesRepoName,
    _private: true,
  }
  await createReposAndAddToTeam(orgApi, repoApi, existingTeams, existingRepos, repoOption)

  // check for specific hooks
  await addTektonHook(repoApi)

  if (!hasArgocd) return

  // then create initial gitops repo for teams
  await Promise.all(
    teamIds.map(async (teamId) => {
      const name = `team-${teamId}-argocd`
      const option = { ...repoOption, autoInit: true, name }
      return upsertRepo(existingTeams, existingRepos, orgApi, repoApi, option, `team-${teamId}`)
    }),
  )
  if (errors.length) {
    console.error(`Errors found: ${JSON.stringify(errors, null, 2)}`)
    process.exit(1)
  } else {
    console.info('Success!')
  }
}

async function runSetupGitea(GITEA_PASSWORD: string, GITEA_URL: string, TEAM_CONFIG: any, hasArgocd: boolean) {
  try {
    await setupGitea(GITEA_PASSWORD, GITEA_URL, TEAM_CONFIG, hasArgocd)
    console.debug('Gitea setup/reconfiguration completed')
  } catch (error) {
    console.debug('Error could not run setup gitea', error)
    console.debug('Retrying in 30 seconds')
    await new Promise((resolve) => setTimeout(resolve, 30000))
    console.log('Retrying to setup gitea')
    await setupGitea(GITEA_PASSWORD, GITEA_URL, TEAM_CONFIG, hasArgocd)
  }
}

// Exec Gitea CLI command
export function buildTeamString(teamNames: any[]): string {
  if (teamNames === undefined) return '{}'
  const teamObject: groupMapping = {}
  teamNames.forEach((teamName: string) => {
    teamObject[teamName] = { otomi: ['otomi-viewer', teamName] }
  })
  return JSON.stringify(teamObject)
}

async function execGiteaCLICommand(podNamespace: string, podName: string) {
  try {
    console.debug('Finding namespaces')
    let namespaces: any
    try {
      namespaces = (await k8sApi.listNamespace(undefined, undefined, undefined, undefined, 'type=team')).body
    } catch (error) {
      console.debug('No namespaces found, exited with error:', error)
      throw error
    }
    console.debug('Filtering namespaces with "team-" prefix')
    let teamNamespaces: any
    try {
      teamNamespaces = namespaces.items.map((namespace) => namespace.metadata?.name)
    } catch (error) {
      console.debug('Teamnamespaces exited with error:', error)
      throw error
    }
    if (teamNamespaces.length > 0) {
      const teamNamespaceString = buildTeamString(teamNamespaces)
      const execCommand = [
        'sh',
        '-c',
        `AUTH_ID=$(gitea admin auth list --vertical-bars | grep -E "\\|otomi-idp\\s+\\|" | grep -iE "\\|OAuth2\\s+\\|" | awk -F " " '{print $1}' | tr -d '\n') && gitea admin auth update-oauth --id "$AUTH_ID" --group-team-map '${teamNamespaceString}'`,
      ]
      if (podNamespace && podName) {
        const exec = new k8s.Exec(kc)
        // Run gitea CLI command to update the gitea oauth group mapping
        await exec
          .exec(
            podNamespace,
            podName,
            'gitea',
            execCommand,
            null,
            process.stderr as stream.Writable,
            process.stdin as stream.Readable,
            false,
            (status: k8s.V1Status) => {
              console.log('Exited with status:')
              console.log(JSON.stringify(status, null, 2))
              console.debug('Changed group mapping to: ', teamNamespaceString)
            },
          )
          .catch((error) => {
            console.debug('Error occurred during exec:', error)
            throw error
          })
      }
    } else {
      console.debug('No team namespaces found')
    }
  } catch (error) {
    console.debug(`Error updating IDP group mapping: ${error.message}`)
    throw error
  }
}

async function runExecCommand() {
  try {
    await execGiteaCLICommand('gitea', 'gitea-0')
  } catch (error) {
    console.debug('Error could not run exec command', error)
    console.debug('Retrying in 30 seconds')
    await new Promise((resolve) => setTimeout(resolve, 30000))
    console.log('Retrying to run exec command')
    await runExecCommand()
  }
}

// Operator
export default class MyOperator extends Operator {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected async init() {
    // Watch gitea-operator-cm
    try {
      await this.watchResource(
        '',
        'v1',
        'configmaps',
        async (e) => {
          const { object }: { object: k8s.V1ConfigMap } = e
          const { metadata, data } = object
          const { TEAM_CONFIG } = data as any
          if (metadata && metadata.name !== 'gitea-operator-cm') return
          switch (e.type) {
            case ResourceEventType.Added:
            case ResourceEventType.Modified: {
              try {
                const secretData = (await k8sApi.readNamespacedSecret('gitea-admin', 'gitea-operator')).body.data as any
                const GITEA_PASSWORD = Buffer.from(secretData.GITEA_PASSWORD, 'base64').toString()
                const { GITEA_URL, HAS_ARGOCD } = data as any
                const hasArgocd = HAS_ARGOCD === 'true'
                await runSetupGitea(GITEA_PASSWORD, GITEA_URL, TEAM_CONFIG, hasArgocd)
              } catch (error) {
                console.debug(error)
              }
              break
            }
            default:
              break
          }
        },
        'gitea-operator',
      )
    } catch (error) {
      console.debug(error)
    }
    // Watch all namespaces
    try {
      await this.watchResource('', 'v1', 'namespaces', async (e) => {
        const { object }: { object: k8s.V1Pod } = e
        const { metadata } = object
        // Check if namespace starts with prefix 'team-'
        if (metadata && !metadata.name?.startsWith('team-')) return
        if (metadata && metadata.name === 'team-admin') return
        await runExecCommand()
      })
    } catch (error) {
      console.debug(error)
    }
  }
}

async function main(): Promise<void> {
  const operator = new MyOperator()
  console.info(`Listening to team namespace changes in all namespaces`)
  console.info('Setting up namespace prefix filter to "team-"')
  await operator.start()
  const exit = (reason: string) => {
    operator.stop()
    process.exit(0)
  }

  process.on('SIGTERM', () => exit('SIGTERM')).on('SIGINT', () => exit('SIGINT'))
}

if (typeof require !== 'undefined' && require.main === module) {
  main()
}
