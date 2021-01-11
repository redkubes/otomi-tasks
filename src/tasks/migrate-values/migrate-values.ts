import glob from 'glob'
import yaml from 'js-yaml'
import fs from 'fs'

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

export function otomiValuesLoader(pathList: string[], fileName?: string) {
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

export function getNewVersion() {
  return '0.2.0'
}

export function getOldVersion() {
  return '0.1.0'
}

export function migrateValues(otomiFiles, changes, oldVersion: string, newVersion: string) {
  if (oldVersion === newVersion) {
    throw new Error(`same version detected: ${oldVersion} and ${newVersion}; exiting`)
  } else {
    throw new Error('no breaking change detected; exiting')
  }
}
