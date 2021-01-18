import { assert } from 'chai'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import * as mv from '../migrate-values'

describe('migrate-values.ts', () => {
  const mockIncomingChangesFileName = 'mock-incoming-changes.yaml'
  const mockIncomingChanges = yaml.safeLoadAll(
    fs.readFileSync(path.join(__dirname, mockIncomingChangesFileName), 'utf-8'),
  )
  const randomPath = 'random-path'
  const testPath: string = __dirname + '/otomi-values/env'
  if (!fs.existsSync(testPath)) {
    throw new Error(`
    'otomi-values' test-directory is not present. 
    This check prevents testing without a sample 'otomi-values' directory.
    This test is meaningless without it.

    expected path: ${__dirname + '/otomi-values/env'}
    actual path: ${testPath}
    `)
  }
  xdescribe('acceptance-tests', () => {
    it('')
    it('can migrate displacements', () => {
      mv.globWrapper(testPath, (files) => {
        assert.deepEqual(
          mv.migrateValues(
            mv.otomiValuesLoader(files),
            mockIncomingChanges,
            mv.getOldVersion(),
            mv.getNewVersion(),
            'displacements',
          ),
          {
            old: {
              charts: {
                president: {
                  lastname: 'Lincoln',
                },
              },
            },
            new: {
              charts: {
                'cert-manager': {
                  president: {
                    lastname: 'Lincoln',
                  },
                },
              },
            },
          },
        )
      })
    })
  })

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
    it('can find files that have the same substring', () => {
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
      assert.deepEqual(mv.otomiValuesLoader(testPathList, 'secrets.teams.yaml'), {
        teamConfig: {
          teams: {
            demo: {
              alerts: {
                email: {
                  critical: 'admins@yourdoma.in',
                },
              },
              oidc: {
                groupMapping: 'somesecretvalue',
              },
              password: 'somesecretvalue',
            },
          },
        },
      })
    })
    it('can find files in subdirectories', () => {
      assert.deepEqual(mv.otomiValuesLoader(testPathList, 'charts/drone.yaml'), {
        charts: {
          drone: {
            enabled: false,
            debug: false,
            orgsFilter: 'redkubes',
            repoFilter: 'redkubes',
            githubAdmins: {
              org: 'redkubes',
              team: 'admins',
            },
            sourceControl: {
              provider: 'github',
              github: {
                server: 'https://github.com',
              },
            },
          },
        },
      })
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
  describe('migrateValues()', () => {
    const mockBreakingChangeVersion = [0, 2, 0]
    const mockNotABreakingChangeVersion = [0, 2, 1]
    let otomiValuesFiles = {}
    mv.globWrapper(testPath, (files: string[]) => {
      otomiValuesFiles = mv.otomiValuesLoader(files, 'teams.yaml')
    })
    it('throws if the version is the same', () => {
      assert.throws(function () {
        mv.migrateValues(otomiValuesFiles, mockIncomingChanges, mockBreakingChangeVersion, mockBreakingChangeVersion)
      }, 'same version detected: 0,2,0 and 0,2,0; exiting')
    })

    const breakingChangeErrorMessage = 'no breaking change detected; exiting'
    it('throws if there is no forwards breaking change', () => {
      assert.throws(function () {
        mv.migrateValues(
          otomiValuesFiles,
          mockIncomingChanges,
          mockBreakingChangeVersion,
          mockNotABreakingChangeVersion,
        )
      }, breakingChangeErrorMessage)
    })
    it('throws if otomiValues is undefined', () => {
      assert.throws(function () {
        mv.migrateValues(undefined, mockIncomingChanges, mockBreakingChangeVersion, [0, 3, 0])
      }, 'The otomiValues files given are undefined; exiting')
    })
    it('throws if changes are undefined', () => {
      assert.throws(function () {
        mv.migrateValues(otomiValuesFiles, undefined, mockBreakingChangeVersion, [0, 3, 0])
      }, 'The changes file given is undefined; exiting')
    })
  })
  describe('getNewVersion()', () => {
    it('can read the new version based on a revision hash', () => {
      assert.deepEqual(mv.getNewVersion(), [0, 2, 0])
    })
  })
  describe('getOldVersion', () => {
    it('can read the old version from a file in the otomi-values repository', () => {
      assert.deepEqual(mv.getOldVersion(), [0, 1, 0])
    })
  })
  describe('migrateValuesVersionConverter()', () => {
    it('takes a semver and outputs it as an array of numbers', () => {
      assert.deepEqual(mv.migrateValuesVersionConverter('0.2.0'), [0, 2, 0])
    })
    it('takes a different semver and outputs it as an array of numbers', () => {
      assert.deepEqual(mv.migrateValuesVersionConverter('0.1.0'), [0, 1, 0])
    })
  })
  describe('incompatibleAPIChange()', () => {
    it('takes a SemVer and returns true (ie. incompatible) if a minor is upgraded', () => {
      assert.isOk(mv.incompatibleAPIChange([0, 2, 0]))
    })
    it('returns false if SemVer does not indicate breaking change', () => {
      assert.isNotOk(mv.incompatibleAPIChange([0, 2, 1]))
    })
  })
  describe('displacementHelper()', () => {
    const noChanges = {}
    const randomValue = 'blabla'
    it('changes one property in-place', () => {
      const randomOtomiValuesFile = {
        a: randomValue,
      }
      const changesModifyOneProperty = {
        displacements: {
          a: 'b',
        },
      }
      assert.deepEqual(mv.displacementHelper(randomOtomiValuesFile, changesModifyOneProperty), {
        old: {
          a: randomValue,
        },
        new: {
          a: randomValue,
          b: randomValue,
        },
      })
    })
    it('changes one other property in-place too', () => {
      const randomOtomiValuesFile = {
        c: randomValue,
      }
      const changesModifyOneProperty = {
        displacements: {
          c: 'a',
        },
      }
      assert.deepEqual(mv.displacementHelper(randomOtomiValuesFile, changesModifyOneProperty), {
        old: {
          c: randomValue,
        },
        new: {
          c: randomValue,
          a: randomValue,
        },
      })
    })
    it('changes no properties without displacements key', () => {
      assert.deepEqual(mv.displacementHelper({}, noChanges), {})
    })
    it('changes nested properties', () => {
      assert.deepEqual(
        mv.displacementHelper(
          {
            d: {
              e: randomValue,
            },
          },
          {
            displacements: {
              'd.e': 'f.e',
            },
          },
        ),
        {
          old: {
            d: {
              e: randomValue,
            },
          },
          new: {
            d: {
              e: randomValue,
            },
            f: {
              e: randomValue,
            },
          },
        },
      )
    })
    it('changes deep nested properties', () => {
      assert.deepEqual(
        mv.displacementHelper(
          {
            f: {
              g: {
                h: {
                  i: randomValue,
                },
              },
            },
          },
          {
            displacements: {
              'f.g.h.i': 'h',
            },
          },
        ),
        {
          old: {
            f: {
              g: {
                h: {
                  i: randomValue,
                },
              },
            },
          },
          new: {
            f: {
              g: {
                h: {
                  i: randomValue,
                },
              },
            },
            h: randomValue,
          },
        },
      )
    })
    it('changes shallow properties to nested properties', () => {
      assert.deepEqual(
        mv.displacementHelper(
          {
            j: randomValue,
          },
          {
            displacements: {
              j: 'i.k.l',
            },
          },
        ),
        {
          old: {
            j: randomValue,
          },
          new: {
            j: randomValue,
            i: {
              k: {
                l: randomValue,
              },
            },
          },
        },
      )
    })
    it('changes multiple properties', () => {
      assert.deepEqual(
        mv.displacementHelper(
          {
            m: 'x',
            o: 'y',
          },
          {
            displacements: {
              m: 'q.r.s',
              o: 't.u',
            },
          },
        ),
        {
          old: {
            m: 'x',
            o: 'y',
          },
          new: {
            m: 'x',
            o: 'y',
            q: {
              r: {
                s: 'x',
              },
            },
            t: {
              u: 'y',
            },
          },
        },
      )
    })
    it('appends a property to an existing object', () => {
      assert.deepEqual(
        mv.displacementHelper(
          {
            aa: {
              bb: {
                cc: {
                  dd: {
                    ee: 'ff',
                  },
                },
                gg: {
                  jj: {
                    kk: 'mm',
                    nn: 'oo',
                  },
                },
              },
            },
          },
          {
            displacements: {
              'aa.bb.cc.dd.ee': 'aa.bb.gg.jj.ee',
            },
          },
        ),
        {
          old: {
            aa: {
              bb: {
                cc: {
                  dd: {
                    ee: 'ff',
                  },
                },
                gg: {
                  jj: {
                    kk: 'mm',
                    nn: 'oo',
                  },
                },
              },
            },
          },
          new: {
            aa: {
              bb: {
                cc: {
                  dd: {
                    ee: 'ff',
                  },
                },
                gg: {
                  jj: {
                    ee: 'ff',
                    kk: 'mm',
                    nn: 'oo',
                  },
                },
              },
            },
          },
        },
      )
    })
  })
})
