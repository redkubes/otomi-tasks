import path from 'path'
import minimist from 'minimist'
import * as mv from './migrate-values'
import yaml from 'js-yaml'
import fs from 'fs'

const argv = minimist(process.argv.slice(2))
console.log(argv)
if ('env-dir' in argv && 'file' in argv && 'changes' in argv && 'op' in argv) {
  mv.globWrapper(argv['env-dir'], (files) => {
    const param = {
      otomiValues: mv.otomiValuesLoader(files, argv['file']),
      changes: yaml.safeLoadAll(fs.readFileSync(path.resolve(argv['changes']), 'utf-8'))[0],
      oldVersion: mv.getOldVersion(),
      newVersion: mv.getNewVersion(),
      operation: argv['op'],
    }

    const change = mv.migrateValues(
      param['otomiValues'],
      param['changes'],
      param['oldVersion'],
      param['newVersion'],
      param['operation'],
    )

    console.log(`CHECK IF THESE CHANGES MAKE SENSE`)
    console.log(JSON.stringify(change, null, 4))
  })
}
