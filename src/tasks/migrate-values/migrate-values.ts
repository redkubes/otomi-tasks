import glob from 'glob'
import yaml from 'js-yaml'

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function globWrapper(path: string, cb?) {
  if (!path.includes('/env')) {
    throw new Error('Does not contain env substring')
  }
  if (cb) {
    glob('**/*.yaml', { cwd: path }, (error, files: string[]) => {
      cb(files)
    })
  }
}

export function otomiValuesLoader(pathList: string) {
  return {}
}
