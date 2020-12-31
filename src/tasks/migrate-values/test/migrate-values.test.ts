import { assert, expect } from 'chai'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import * as mv from '../migrate-values'
import { get, isEmpty, isEqual, isMatch } from 'lodash'

const mockIncomingChangesFileName = 'mock-incoming-changes.yaml'
const mockIncomingChanges = yaml.safeLoadAll(
  fs.readFileSync(path.join(__dirname, mockIncomingChangesFileName), 'utf-8'),
)

describe('migrate-values.ts', () => {
  const testPath = path.join(__dirname, 'otomi-values')
  describe('readOtomiValuesDir()', () => {
    it('can find something that looks like an otomi-values directory', () => {
      assert(get(mv.readOtomiValuesDir(testPath), 'env', 'charts') !== undefined)
    })
    it('should throw an error with an invalid path', () => {
      const wrongPath = 'invalid-path'
      assert.throws(function () {
        isEmpty(mv.readOtomiValuesDir(wrongPath))
      }, Error)
    })
    it('should throw an error with an empty path', () => {
      const wrongPath = ''
      assert.throws(function () {
        isEmpty(mv.readOtomiValuesDir(wrongPath))
      }, Error)
    })
  })
  describe('listEnvDirectory()', () => {
    it('can read the test directory otomi-values', () => {
      const envDir = mv.readOtomiValuesDir(testPath)
      assert(
        isMatch(mv.listEnvDirectory(envDir), {
          'otomi-values': {
            env: ['charts', 'clouds', 'teams'],
          },
        }),
        "listEnvDirectory doesn't return the contents of env",
      )
    })
  })
})
