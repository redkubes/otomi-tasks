import path from 'path'
import minimist from 'minimist'
import * as mv from './migrate-values'
import yaml from 'js-yaml'

const argv = minimist(process.argv.slice(2))
if ('env-dir' in argv) {
  mv.globWrapper(argv['env-dir'], (files) => {
    const param = {
      otomiValues: mv.otomiValuesLoader(files, 'jobs.demo.yaml'),
      changes: {},
      oldVersion: mv.getOldVersion(),
      newVersion: mv.getNewVersion(),
      operation: 'displacements',
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
