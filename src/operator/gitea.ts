import Operator from '@dot-i/k8s-operator'
import * as k8s from '@kubernetes/client-node'
import { KubeConfig } from '@kubernetes/client-node'
import stream from 'stream'

const kc = new KubeConfig()
kc.loadFromDefault()
const k8sApi = kc.makeApiClient(k8s.CoreV1Api)

function buildTeamString(teamNames: any[]): string {
  if (teamNames === undefined) return '{}'
  let result = '{'

  for (let i = 0; i < teamNames.length; i++) {
    const teamName = teamNames[i]
    const teamObject = `"/${teamName}":{"otomi":["otomi-viewer", "${teamName}"]}`

    if (i === teamNames.length - 1) {
      // If it's the last team name, don't add a comma
      result += teamObject
    } else {
      result += `${teamObject}, `
    }
  }

  result += '}'
  return result
}

export default class MyOperator extends Operator {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected async init() {
    console.debug('Starting initializing')
    // Watch all namespaces
    try {
      await this.watchResource('', 'v1', 'namespaces', async (e) => {
        console.debug(e)
        const { object } = e
        console.debug(object)
        const { metadata } = object
        console.debug(metadata)
        // Check if namespace starts with prefix 'team-'
        if (metadata && !metadata.name?.startsWith('team-')) return
        try {
          console.debug('Finding namespaces')
          const namespaces = await k8sApi.listNamespace()
          console.debug('Filtering namespaces with "team-" prefix')
          const teamNamespaces = namespaces.body.items
            .map((namespace) => namespace.metadata?.name)
            .filter((name) => name && name.startsWith('team-') && name !== 'team-admin')
          if (teamNamespaces.length > 0) {
            const giteaPodLabel = 'app=gitea'
            console.debug('Getting giteapod list')
            const giteaPodList = await k8sApi.listNamespacedPod(
              'gitea',
              undefined,
              undefined,
              undefined,
              undefined,
              giteaPodLabel,
            )
            console.debug('Selecting giteapod from list')
            const giteaPod = giteaPodList.body.items[0]
            console.debug('Creating exec command')
            const execCommand = [
              'sh',
              '-c',
              `gitea admin auth update-oauth --id 1 --group-team-map '${buildTeamString(teamNamespaces)}'`,
            ]
            const exec = new k8s.Exec(kc)
            console.debug('Trying to run the following commands:')
            console.debug(execCommand)
            // Run gitea CLI command to update the gitea oauth group mapping
            exec.exec(
              giteaPod.metadata?.namespace || 'gitea',
              giteaPod.metadata?.name || 'gitea-0',
              'gitea',
              execCommand,
              process.stdout as stream.Writable,
              process.stderr as stream.Writable,
              process.stdin as stream.Readable,
              true,
              (status: k8s.V1Status) => {
                console.log('Exited with status:')
                console.log(JSON.stringify(status, null, 2))
              },
            )
          } else {
            console.debug('No team namespaces found')
          }
        } catch (error) {
          console.debug(
            `Error updating IDP group mapping: statuscode: ${error.response.body.code} - message: ${error.response.body.message}`,
          )
        }
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
