import glob from 'glob'

export function globWrapper(path: string, cb) {
  if (!path.includes('/env')) {
    throw new Error('Does not contain env substring')
  }

  glob('**/*.yaml', { cwd: path }, (error, files) => {
    cb(files)
  })
}
