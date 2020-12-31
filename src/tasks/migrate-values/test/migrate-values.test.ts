import { assert, expect } from 'chai'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import * as mv from '../migrate-values'
import { has, isEqual } from 'lodash'

const mockIncomingChangesFileName = 'mock-incoming-changes.yaml'
const mockIncomingChanges = yaml.safeLoadAll(
  fs.readFileSync(path.join(__dirname, mockIncomingChangesFileName), 'utf-8'),
)

describe('TDD test suite', () => {
  it('can find something that looks like an otomi-values directory', () => {
    const testPath = path.join(__dirname, 'otomi-values')
    assert(has(mv.readOtomiValuesDir(testPath), 'env'), "the built dictionary doesn't have this key 'env'")
  })

  it('can read the test directory otomi-values', () => {
    const envDirPath = mv.readOtomiValuesDir('otomi-values')
    assert(
      isEqual(mv.listEnvDirectory(envDirPath), {
        'otomi-values': {
          env: ['charts', 'clouds', 'teams'],
        },
      }),
      "listEnvDirectory doesn't return the contents of env",
    )
  })
})
