import glob from 'glob'
import yaml from 'js-yaml'
import fs from 'fs'
import zipObjectDeep from 'lodash'

export function globWrapper(path: string, cb?) {
  if (!path.includes('/env')) {
    throw new Error('Does not contain env substring')
  }
  if (cb) {
    glob('**/*.yaml', { cwd: path }, (error, files: string[]) => {
      cb(files.map((f) => path + '/' + f))
    })
  }
}

export function otomiValuesLoader(pathList: string[], fileName?: string): object {
  if (fileName) {
    const re = new RegExp(`/env/${fileName}$`)
    return yaml.load(
      fs.readFileSync(
        pathList.find((element) => re.exec(element)),
        'utf-8',
      ),
    )
  }
}

export function migrateValuesVersionConverter(version: string) {
  return version.split('.').map(Number)
}

export function getNewVersion() {
  return migrateValuesVersionConverter('0.2.0')
}

export function getOldVersion() {
  return migrateValuesVersionConverter('0.1.0')
}
export function incompatibleAPIChange(semVer: number[]) {
  return semVer[2] === 0
}

export function expandIntoObject(k: string, v: string): object {
  return zipObjectDeep([k], [v])
}

export function displacementHelper(otomiValuesFile: any, changes: any): object {
  if (changes.displacements) {
    const kv: [string, any][] = Object.entries(changes.displacements)

    const v = kv[0][0]
      .split('.')
      .reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : undefined), otomiValuesFile)

    const applyChanges = kv[0][1].includes('.') ? expandIntoObject(kv[0][1], v) : Object.fromEntries([[kv[0][1], v]])

    return {
      old: otomiValuesFile,
      new: applyChanges,
    }
  }
  return {}
}

export function migrateValues(
  otomiValues,
  changes,
  oldVersion: number[],
  newVersion: number[],
  operation?: string,
): object {
  if (oldVersion === newVersion) {
    throw new Error(`same version detected: ${oldVersion} and ${newVersion}; exiting`)
  } else if (!incompatibleAPIChange(newVersion)) {
    throw new Error('no breaking change detected; exiting')
  } else {
    switch (operation) {
      case 'displacements':
        return
      case 'deletions':
        return
      default:
        return
    }
  }
}
