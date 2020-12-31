import { assert, expect } from 'chai'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import * as mv from '../migrate-values'
import { isEqual } from 'lodash'

const mockIncomingChangesFileName = 'mock-incoming-changes.yaml'
const mockIncomingChanges = yaml.safeLoadAll(
  fs.readFileSync(path.join(__dirname, mockIncomingChangesFileName), 'utf-8'),
)

describe('TDD test suite', () => {
  it('can find otomi-values/env', () => {
    const testPath = path.join(__dirname, 'otomi-values')
    assert(mv.readEnvDir(testPath))
  })

  it('can use a real otomi-values path', () => {
    assert(mv.readEnvDir(process.env.ENV_DIR))
  })

  it('can read the test directory otomi-values', () => {
    const envDirPath = mv.readEnvDir('otomi-values')
    assert(
      isEqual(mv.listEnvDirectory(envDirPath), {
        'otomi-values': {
          env: ['charts', 'clouds', 'teams'],
        },
      }),
      'listEnvDirectory returns the contents of env',
    )
  })
})
