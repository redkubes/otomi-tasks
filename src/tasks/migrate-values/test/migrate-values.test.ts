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
  const testPath = path.join(__dirname, 'otomi-values')
  describe('readOtomiValuesDir()', () => {
    it('can find something that looks like an otomi-values directory', () => {
      assert(get(mv.readOtomiValuesDir(testPath), 'env', 'charts') !== undefined)
    })
    it('should throw an error with an invalid path', () => {
      const wrongPath = 'invalid-path'
      assert.throws(() => {
        isEmpty(mv.readOtomiValuesDir(wrongPath))
      }, Error)
    })
    it('should throw an error with an empty path', () => {
      const wrongPath = ''
      assert.throws(() => {
        isEmpty(mv.readOtomiValuesDir(wrongPath))
      }, Error)
    })
  })
  describe('listEnvDirectory()', () => {
    it('looks like otomi-values', () => {
      assert(
        isMatch(mv.listEnvDirectory(mv.readOtomiValuesDir(testPath)), {
          'otomi-values': {
            env: ['charts', 'clouds', 'teams'],
          },
        }),
        "listEnvDirectory doesn't return the contents of env",
      )
    })
    it("has a key 'otomi-values' which is empty if there is a wrong envDir", () => {
      assert(isEqual(mv.listEnvDirectory({}), { 'otomi-values': {} }))
    })
  })
  describe('globYAML()s', () => {
    const options = {
      cwd: testPath,
    }
    glob('**/*.ya*ml', options, (error, files) => {
      console.log(files)
    })
  })
})
