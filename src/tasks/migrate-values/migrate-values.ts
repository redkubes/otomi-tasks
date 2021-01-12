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

export function migrateValues(otomiFiles, changes, oldVersion: number[], newVersion: number[], operation?: string) {
  if (oldVersion === newVersion) {
    throw new Error(`same version detected: ${oldVersion} and ${newVersion}; exiting`)
  } else if (!incompatibleAPIChange(newVersion)) {
    throw new Error('no breaking change detected; exiting')
  } else {
    switch (operation) {
      case 'displacements':
        return {
          old: {
            charts: {
              president: {
                lastname: 'Lincoln',
              },
            },
            new: {
              charts: {
                'cert-manager': {
                  president: {
                    lastname: 'Lincoln',
                  },
                },
              },
            },
          },
        }
      case 'deletions':
        return {
          old: {
            charts: {
              president: {
                firstName: 'Abraham',
              },
            },
          },
        }
      default:
        return {
          old: {
            charts: {
              president: {
                lastName: 'Lincoln',
                firstName: 'Abraham',
              },
            },
          },
          new: {
            charts: {
              'cert-manager': {
                lastName: 'Lincoln',
              },
            },
          },
        }
    }
  }
}
