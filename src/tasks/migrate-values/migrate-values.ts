import { readdirSync } from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { isEmpty } from 'lodash'

export function readOtomiValuesDir(path: string): object {
  const files: string[] = []
  const envPath = path + '/env'
  try {
    readdirSync(envPath).forEach((file) => files.push(file))
    return { env: files }
  } catch (error) {
    throw new Error(error)
  }
}

export function listEnvDirectory(envDirContents: object): object {
  return {
    'otomi-values': envDirContents,
  }
}
