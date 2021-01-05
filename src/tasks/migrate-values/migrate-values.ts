import glob from 'glob'

export function globWrapper(path: string) {
  if (!path.includes('/env')) {
    throw new Error('Does not contain env substring')
  }
  return path
}
