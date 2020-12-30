import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

export function findPath(fileName: string) {
  return path.join(__dirname, fileName)
}

export function dirHasEnvFolder(path: string) {
  return false
}

function main() {
  //
}

main()
