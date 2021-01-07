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
  const testPath: string = __dirname + '/otomi-values/env'
  const randomPath = 'random-path'
  if (!fs.existsSync(testPath)) {
    throw new Error(`
    'otomi-values' test-directory is not present. 
    This check prevents testing without a sample 'otomi-values' directory.
    This test is meaningless without it.

    expected path: ${__dirname + '/otomi-values/env'}
    actual path: ${testPath}
    `)
  }
  describe('globWrapper()', () => {
    it('only works with /env sub-path', () => {
      assert.doesNotThrow(function () {
        mv.globWrapper(testPath)
      }, 'Does not contain env substring')
    })
    it(`it shouldn't work with a path-string without env`, () => {
      assert.throws(function () {
        mv.globWrapper(randomPath)
      }, 'Does not contain env substring')
    })
    it('should return list of yaml files', () => {
      mv.globWrapper(testPath, (files) => {
        assert.include(files.join(), '.yaml')
      })
    })
  })
  describe('otomiValuesLoader()', () => {
    let testPathList: string[] = []
    mv.globWrapper(testPath, (files: string[]) => {
      testPathList = files
    })
    it('throws an error if the file is not found', () => {
      const invalidFilename = 'does-not-exist.yaml'
      assert.throws(function () {
        mv.otomiValuesLoader(testPathList, invalidFilename)
      })
    })
    it('can take a file name and return the json object', () => {
      assert.deepEqual(mv.otomiValuesLoader(testPathList, 'teams.yaml'), {
        teamConfig: {
          teams: {
            demo: {
              alerts: {
                receivers: ['email'],
              },
              id: 'demo',
              clusters: ['aws/demo', 'azure/demo', 'google/demo', 'onprem/demo'],
            },
          },
        },
      })
      assert.deepEqual(mv.otomiValuesLoader(testPathList, 'clusters.yaml'), {
        clouds: {
          aws: {
            domain: 'eks.otomi.cloud',
            clusters: {
              demo: {
                enabled: false,
                apiName: 'eks_otomi-cloud_eu-central-1_otomi-eks-demo',
                apiServer: '1.1.1.1',
                k8sVersion: '1.17',
                otomiVersion: 'master',
                region: 'eu-central-1',
              },
            },
          },
          google: {
            domain: 'gke.otomi.cloud',
            clusters: {
              demo: {
                enabled: true,
                apiName: 'gke_otomi-cloud_europe-west4_otomi-gke-demo',
                apiServer: '1.1.1.1',
                k8sVersion: '1.18',
                otomiVersion: 'master',
                region: 'europe-west4',
              },
            },
          },
          azure: {
            domain: 'aks.otomi.cloud',
            clusters: {
              demo: {
                enabled: false,
                apiName: 'aks_otomi-cloud_westeurope_otomi-aks-demo',
                apiServer: '1.1.1.1',
                k8sVersion: '1.18',
                otomiVersion: 'master',
                region: 'westeurope',
              },
            },
          },
          onprem: {
            domain: 'onprem.otomi.cloud',
            clusters: {
              demo: {
                enabled: false,
                dnsProvider: 'google',
                apiName: 'onprem_otomi-cloud',
                apiServer: '1.1.1.1',
                k8sVersion: '1.19',
                otomiVersion: 'master',
                region: 'local',
                entrypoint: '1.1.1.1',
              },
            },
          },
        },
      })
    })
  })
})
