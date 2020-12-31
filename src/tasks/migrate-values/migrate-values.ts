import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

export function readEnvDir(path: string): string {
  return path
}

export function listEnvDirectory(envDirPath: string): object {
  return {
    'otomi-values': {
      env: ['charts', 'clouds', 'teams'],
    },
  }
}

function main() {
  //
}
