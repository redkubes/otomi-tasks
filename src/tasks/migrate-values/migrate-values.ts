import { readdirSync } from 'fs'
import path from 'path'
import yaml from 'js-yaml'

export function readOtomiValuesDir(path: string): object {
  const files: string[] = []
  const envPath = path + '/env'
  try {
    readdirSync(envPath).forEach((file) => files.push(file))
    console.log(files)
    return { env: files }
  } catch (error) {
    console.error('Not an otomi-values directory: ' + error)
    return {}
  }
}

export function listEnvDirectory(envDirContents: object): object {
  return {
    'otomi-values': {
      env: ['charts', 'clouds', 'teams'],
    },
  }
}

function main() {
  //
}
