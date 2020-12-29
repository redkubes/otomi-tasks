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

describe('YAML parsing', () => {
  it('should have one of the revisionSchemaKeys', (done) => {
    const revision = fs.readFileSync(path.join(__dirname, 'revision.yaml'), 'utf8')
    console.log(YAML.parseAllDocuments(revision))
    done()
  })
})
