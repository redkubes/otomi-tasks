import { assert, expect } from 'chai'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import * as mv from '../migrate-values'
import { get, isEmpty, isEqual, isMatch } from 'lodash'
import { glob } from 'glob'

const mockIncomingChangesFileName = 'mock-incoming-changes.yaml'
const mockIncomingChanges = yaml.safeLoadAll(
  fs.readFileSync(path.join(__dirname, mockIncomingChangesFileName), 'utf-8'),
)

describe('migrate-values.ts', () => {
  const testPath: string = __dirname + '/otomi-values/env'
  const randomPath = 'random-path'
  if (!fs.existsSync(testPath)) {
    throw new Error(`
    'otomi-values' test-directory is not present. 
    This check prevents testing without a sample 'otomi-values' directory.
    This test is meaningless without it.

    expected path: ${__dirname + '/otomi-values/env'}
    actual path: ${testPath}
    `)
  }
  describe('globWrapper()', () => {
    it('only works with /env sub-path', () => {
      assert.doesNotThrow(function () {
        mv.globWrapper(testPath)
      }, 'Does not contain env substring')
    })
    it(`it shouldn't work with a path-string without env`, () => {
      assert.throws(function () {
        mv.globWrapper(randomPath)
      }, 'Does not contain env substring')
    })
    it('should return list of yaml files', () => {
      mv.globWrapper(testPath, (files) => {
        assert.include(files.join(), '.yaml')
      })
    })
  })
  describe('otomiValuesLoader()', () => {
    let testPathList = ''
    mv.globWrapper(testPath, (files) => {
      testPathList = files
    })
    it('parses otomi-values/env and returns an object', () => {
      assert.isObject(mv.otomiValuesLoader(testPathList))
    })
  })
})
