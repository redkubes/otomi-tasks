import { assert, expect } from 'chai'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import * as mv from '../migrate-values'
import { get, isEmpty, isEqual } from 'lodash'

const mockIncomingChangesFileName = 'mock-incoming-changes.yaml'
const mockIncomingChanges = yaml.safeLoadAll(
  fs.readFileSync(path.join(__dirname, mockIncomingChangesFileName), 'utf-8'),
)

describe('migrate-values.ts', () => {
  describe('readOtomiValuesDir()', () => {
    it('can find something that looks like an otomi-values directory', () => {
      const testPath = path.join(__dirname, 'otomi-values')
      assert(get(mv.readOtomiValuesDir(testPath), 'env', 'charts') !== undefined)
    })
    it('should return {} with an invalid path', () => {
      const wrongPath = 'invalid-path'
      assert.throws(function () {
        if (isEmpty(mv.readOtomiValuesDir(wrongPath))) {
          throw new Error()
        }
      }, Error)
    })
    it('should return {} with an empty path', () => {
      const wrongPath = ''
      assert.throws(function () {
        if (isEmpty(mv.readOtomiValuesDir(wrongPath))) {
          throw new Error()
        }
      }, Error)
    })
  })
  describe('listEnvDirectory()', () => {
    it('can read the test directory otomi-values', () => {
      const envDirPath = mv.readOtomiValuesDir(path.join(__dirname, 'otomi-values'))
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
})
