import { assert, expect } from 'chai'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import * as mv from '../migrate-values'

const mockIncomingChangesFileName = 'test/mock-incoming-changes.yaml'
const mockIncomingChanges = yaml.safeLoadAll(fs.readFileSync(mv.findPath(mockIncomingChangesFileName), 'utf-8'))

describe('TDD test suite', () => {
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

  describe('otomi-values path finding', () => {
    it('can find a valid Linux path', () => {
      const re = new RegExp('^(/[^/ ]*)+/?$')
      expect(mv.findPath('')).to.match(re)
      expect(mv.findPath('random-string')).to.match(re)
    })

    it('can talk with an env folder in an otomi-values repository', () => {
      assert.isOk(mv.dirHasEnvFolder(mv.findPath('')))
    })
  })
})
