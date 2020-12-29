import { assert } from 'chai'
import fs from 'fs'
import path from 'path'
import YAML from 'yaml'

const revisionSchemaKeys: string[] = [
  'REV',
  'displacements',
  'deletions',
  'forwardMutations',
  'backwardMutations',
  'version',
]

const revision = fs.readFileSync(path.join(__dirname, 'revision.yaml'), 'utf8')

describe('YAML parsing', () => {
  it('should have one of the revisionSchemaKeys', (done) => {
    console.log(YAML.parseAllDocuments(revision).toString())
    done()
  })
})
