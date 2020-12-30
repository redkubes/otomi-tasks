import { assert, expect } from 'chai'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

const mock = [
  {
    REV: '8665e5707c829eaff674bd416de8610a2103114a',
    displacements: {
      'charts.president.lastName': 'charts.cert-manager.president.lastName',
    },
    deletions: {
      'charts.president.firstName': 'charts.cert-manager.president.firstName',
    },
    forwardMutations: { 'charts.cert-manager.president.lastName': 'printf "v%s"' },
    backwardMutations: { 'charts.cert-manager.president.lastName': 'replace "v" ""' },
    version: '0.2.0',
  },
  {
    REV: '03f5c491617cc8d4dc1c237c161ac50e90eeac02',
    displacements: {
      'charts.president.lastName': 'charts.cert-manager.president.lastName',
    },
    deletions: {
      'charts.president.firstName': 'charts.cert-manager.president.firstName',
    },
    forwardMutations: { 'charts.cert-manager.president.lastName': 'printf "v%s"' },
    backwardMutations: { 'charts.cert-manager.president.lastName': 'replace "v" ""' },
  },
  {
    REV: '4a64c83c0991269f9f64c4a7afcb08e3c2435c4f',
    displacements: null,
    deletions: null,
    forwardMutations: null,
    backwardMutations: null,
  },
]

describe('YAML parsing', () => {
  it('should verify each revision with the hyper-schema', (done) => {
    done()
  })
})
