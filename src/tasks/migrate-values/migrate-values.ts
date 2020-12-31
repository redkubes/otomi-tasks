import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

export function readOtomiValuesDir(path: string): object {
  return { env: 'charts' }
}

export function listEnvDirectory(envDir: object): object {
  return {
    'otomi-values': {
      env: ['charts', 'clouds', 'teams'],
    },
  }
}

function main() {
  //
}
