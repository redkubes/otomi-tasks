import { expect } from 'chai'
import {
  DroneSecret,
  getGiteaAuthorizationHeaderCookies,
  GiteaDroneError,
  isSecretValid,
  getCookieValue,
} from './gitea-drone-oauth'
import { OAuth2Application } from '@redkubes/gitea-client-node'
import sinon from 'sinon'
import axios from 'axios'

describe('Gitea-Drone: Validate Secrets', () => {
  let consoleLog: sinon.SinonStub
  let sandbox: sinon.SinonSandbox
  beforeEach(() => {
    sandbox = sinon.createSandbox()
    consoleLog = sandbox.stub(console, 'log')
  })
  afterEach(() => {
    sandbox.restore()
  })
  it('should successfully validate secret', () => {
    const stubRemoteSecret: DroneSecret = {
      clientId: Buffer.from('abc').toString('base64'),
      clientSecret: Buffer.from('def').toString('base64'),
    }
    const stubOauthApps: OAuth2Application[] = [
      {
        name: 'otomi-drone',
        clientId: 'abc',
      },
    ]
    expect(isSecretValid(stubRemoteSecret, stubOauthApps)).to.be.true
  })
  it('should fail to validate on no secret', () => {
    const stubOauthApps: OAuth2Application[] = [
      {
        name: 'otomi-drone',
        clientId: 'abc',
      },
    ]
    expect(isSecretValid(undefined, stubOauthApps)).to.be.false
    expect(consoleLog.calledWith('Remote secret was not found')).to.be.true
  })
  it('should fail validation when the secret contains invalid data', () => {
    const stubRemoteSecret: DroneSecret = {
      clientId: '',
      clientSecret: Buffer.from('def').toString('base64'),
    }
    const stubOauthApps: OAuth2Application[] = [
      {
        name: 'otomi-drone',
        clientId: 'abc',
      },
    ]
    expect(isSecretValid(stubRemoteSecret, stubOauthApps)).to.be.false
    expect(consoleLog.calledWith('Remote secret values were empty')).to.be.true
  })
  it('should fail validation when the secret contains invalid data', () => {
    const stubRemoteSecret: DroneSecret = {
      clientId: Buffer.from('abc').toString('base64'),
      clientSecret: '',
    }
    const stubOauthApps: OAuth2Application[] = [
      {
        name: 'otomi-drone',
        clientId: 'abc',
      },
    ]
    expect(isSecretValid(stubRemoteSecret, stubOauthApps)).to.be.false
    expect(consoleLog.calledWith('Remote secret values were empty')).to.be.true
  })
  it('should fail to validate on empty OAuthApp list', () => {
    const stubRemoteSecret: DroneSecret = {
      clientId: Buffer.from('abc').toString('base64'),
      clientSecret: Buffer.from('def').toString('base64'),
    }
    const stubOauthApps: OAuth2Application[] = []
    expect(isSecretValid(stubRemoteSecret, stubOauthApps)).to.be.false
    expect(consoleLog.calledWith("Gitea doesn't have any oauth application defined")).to.be.true
  })
  it('should fail to validate on non equal values', () => {
    const stubRemoteSecret: DroneSecret = {
      clientId: Buffer.from('abc').toString('base64'),
      clientSecret: Buffer.from('def').toString('base64'),
    }
    const stubOauthApps: OAuth2Application[] = [
      {
        name: 'otomi-drone',
        clientId: 'abcd',
      },
    ]
    expect(isSecretValid(stubRemoteSecret, stubOauthApps)).to.be.false
    expect(consoleLog.calledWith('OAuth data did not match with expected secret')).to.be.true
  })
})

describe('Gitea-Drone: Parse CSRF Token', () => {
  const cookieName = '_csrf'
  it('should successfully validate the token', () => {
    const stubHeaderCookies: string[] = [`${cookieName}:abc`]
    expect(getCookieValue(stubHeaderCookies, cookieName)).to.be.equal('abc')
  })
  it('should successfully validate parse the token from string', () => {
    const stubHeaderCookies: string[] = [`${cookieName}:abc;`]
    expect(getCookieValue(stubHeaderCookies, cookieName)).to.be.equal('abc')
  })
  it('should successfully validate parse the token from string containing more key/values', () => {
    const stubHeaderCookies: string[] = [`${cookieName}:abc;redkubes:otomi`]
    expect(getCookieValue(stubHeaderCookies, cookieName)).to.be.equal('abc')
  })
  it('should fail without a CSRF cookie', () => {
    const stubHeaderCookies: string[] = ['redkubes:otomi']
    expect(() => getCookieValue(stubHeaderCookies, cookieName)).to.throw(
      GiteaDroneError,
      `No ${cookieName} cookie was returned`,
    ) // Need to expect(()=>func) otherwise throw will fail
  })
  it('should fail without a CSRF token', () => {
    const stubHeaderCookies: string[] = [`${cookieName}:;`]
    expect(() => getCookieValue(stubHeaderCookies, cookieName)).to.throw(
      GiteaDroneError,
      `No value for ${cookieName} was found`,
    ) // Need to expect(()=>func) otherwise throw will fail
  })
})

describe('Gitea-Drone: Authorize OAuth', () => {
  let sandbox: sinon.SinonSandbox
  beforeEach(() => (sandbox = sinon.createSandbox()))
  afterEach(() => sandbox.restore())
  it('should successfully validate authorize header', async () => {
    const resolved = new Promise((r) => r({ headers: { 'set-cookie': 'abc' } }))
    sandbox.stub(axios, 'get').returns(resolved)
    sandbox.stub(console, 'log')
    const giteaUrl = 'localhost'
    const droneLoginUrl = 'localhost/login'
    const oauthData: DroneSecret = {
      clientId: 'abc',
      clientSecret: 'def',
    }
    const data = await getGiteaAuthorizationHeaderCookies(giteaUrl, droneLoginUrl, oauthData)
    expect(data).to.be.equal('abc')
  })
})