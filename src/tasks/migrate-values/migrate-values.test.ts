import { assert, expect } from 'chai'
import { compile, compileFromFile } from 'json-schema-to-typescript'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { isValidOtomiPath } from './migrate-values'

function findPath(fileName) {
  return path.join(__dirname, fileName)
}

const mockIncomingChangesFileName = 'mock-incoming-changes.yaml'
const mockIncomingChanges: any[] = yaml.safeLoadAll(fs.readFileSync(findPath(mockIncomingChangesFileName), 'utf-8'))

describe('', () => {
  before(function () {
    //
  })

  after(function () {
    //
  })

  beforeEach(function () {
    //
  })

  afterEach(function () {
    //
  })

  it('will use a valid otomi-values repository', () => {
    assert.isNotOk(isValidOtomiPath('random-not-working-path'))
  })
})
