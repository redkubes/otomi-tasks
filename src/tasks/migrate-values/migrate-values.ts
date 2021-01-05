import glob from 'glob'

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function globWrapper(path: string, cb?: Function) {
  if (!path.includes('/env')) {
    throw new Error('Does not contain env substring')
  }

  glob('**/*.yaml', { cwd: path }, (error, files) => {
    cb(files)
  })
}
