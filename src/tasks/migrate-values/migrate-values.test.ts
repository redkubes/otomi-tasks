import { assert } from 'chai'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

const revisionSchemaKeys: string[] = [
  'REV',
  'displacements',
  'deletions',
  'forwardMutations',
  'backwardMutations',
  'version',
]

const revisionPath = fs.readFileSync(path.join(__dirname, 'revision.yaml'), 'utf8')

describe('YAML parsing', () => {
  it('should have one of the revisionSchemaKeys', (done) => {
    console.log(yaml.safeLoadAll(revisionPath))
    done()
  })
})
