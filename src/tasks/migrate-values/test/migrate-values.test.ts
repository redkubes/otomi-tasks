import { assert, expect } from 'chai'
import { compile, compileFromFile } from 'json-schema-to-typescript'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

function findPath(fileName) {
  return path.join(__dirname, fileName)
}

const mockIncomingChangesFileName = 'mock-incoming-changes.yaml'
const mockIncomingChanges: any[] = yaml.safeLoadAll(fs.readFileSync(findPath(mockIncomingChangesFileName), 'utf-8'))
// const revisionSchemaInterface

describe('', () => {
  before(async function () {
    // Generate type declaration file
    try {
      console.log(await compileFromFile(findPath('../revision-schema.json')))
    } catch (error) {
      console.error(error)
    }
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

  it('will verify the incoming changes using the revisionSchema interface', (done) => {
    // validateIncomingChanges(mockIncomingChanges, revisionSchemaInterface)
    done()
  })
})
