import { assert, expect } from 'chai'
import { compile, compileFromFile } from 'json-schema-to-typescript'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

const mockRevisionPath: string = fs.readFileSync(path.join(__dirname, 'mock-revision.yaml'), 'utf8')
const mockRevision: any[] = yaml.safeLoadAll(revisionPath)

describe('', () => {
  before(function () {
    // runs once before the first test in this block
  })

  after(function () {
    // runs once after the last test in this block
  })

  beforeEach(function () {
    // runs before each test in this block
  })

  afterEach(function () {
    // runs after each test in this block
  })

  it('', (done) => {
    done()
  })
})
