import glob from 'glob'
import yaml from 'js-yaml'
import fs from 'fs'
import { cloneDeep, set } from 'lodash'
import path from 'path'

export function globWrapper(path: string, cb?) {
  if (!path.includes('/env')) {
    throw new Error('Does not contain env substring')
  }
  if (!fs.existsSync(path)) {
    throw new Error(`
    'otomi-values' test-directory is not present. 

    expected path: ${__dirname + '/otomi-values/env'}
    actual path: ${path}
    `)
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

export function displacementHelper(otomiValuesFile: any, changes: any): object {
  if (changes.displacements) {
    const oldOtomiValuesFile = cloneDeep(otomiValuesFile)
    for (const displacement of Object.entries(changes.displacements)) {
      const findValue = displacement[0]
        .split('.')
        .reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : undefined), otomiValuesFile)
      if (typeof displacement[1] === 'string') {
        set(otomiValuesFile, displacement[1], findValue)
      }
    }
    return {
      old: oldOtomiValuesFile,
      new: otomiValuesFile,
    }
  }
  return {}
}

export function migrateValues(
  otomiValues: object,
  changes: object,
  oldVersion: number[],
  newVersion: number[],
  operation?: string,
): object {
  if (oldVersion === newVersion) {
    throw new Error(`same version detected: ${oldVersion} and ${newVersion}; exiting`)
  } else if (!incompatibleAPIChange(newVersion)) {
    throw new Error('no breaking change detected; exiting')
  } else if (otomiValues === undefined) {
    throw new Error('The otomiValues files given are undefined; exiting')
  } else if (changes === undefined) {
    throw new Error('The changes file given is undefined; exiting')
  } else {
    switch (operation) {
      case 'displacements':
        return displacementHelper(otomiValues, changes)
      default:
        return displacementHelper(otomiValues, changes)
    }
  }
}

globWrapper(__dirname + '/test/otomi-values/env', (files) => {
  const param = {
    otomiValues: otomiValuesLoader(files, 'mock.yaml'),
    changes: yaml.safeLoadAll(fs.readFileSync(path.join(__dirname, 'test/mock-incoming-changes.yaml'), 'utf-8'))[0],
    oldVersion: getOldVersion(),
    newVersion: getNewVersion(),
    operation: 'displacements',
  }

  const change = migrateValues(
    param['otomiValues'],
    param['changes'],
    param['oldVersion'],
    param['newVersion'],
    param['operation'],
  )

  console.log(`CHECK IF THESE CHANGES MAKE SENSE`)
  console.log(JSON.stringify(change, null, 4))
})
