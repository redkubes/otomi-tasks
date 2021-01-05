import { assert, expect } from 'chai'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { get, isEmpty, isEqual, isMatch } from 'lodash'
import { glob } from 'glob'

const mockIncomingChangesFileName = 'mock-incoming-changes.yaml'
const mockIncomingChanges = yaml.safeLoadAll(
  fs.readFileSync(path.join(__dirname, mockIncomingChangesFileName), 'utf-8'),
)

describe('migrate-values.ts', () => {
  describe('globYAML()s', () => {
    const options = {
      cwd: testPath,
    }
    glob('**/*.ya*ml', options, (error, files) => {
      console.log(files)
    })
  })
})
