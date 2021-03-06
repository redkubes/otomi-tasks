/* eslint-disable no-template-curly-in-string */
/* eslint-disable camelcase */
import axios from 'axios'

export const defaultsIdpMapperTpl = (env): Array<object> => [
  {
    name: 'upn to email',
    identityProviderAlias: env.IDP_ALIAS,
    identityProviderMapper: 'oidc-user-attribute-idp-mapper',
    config: {
      syncMode: 'INHERIT',
      claim: 'upn',
      'user.attribute': 'email',
    },
  },
  {
    name: 'username mapping',
    identityProviderAlias: env.IDP_ALIAS,
    identityProviderMapper: 'oidc-username-idp-mapper',
    config: {
      template: env.IDP_USERNAME_CLAIM_MAPPER,
      syncMode: 'INHERIT',
    },
  },
  {
    name: 'sub',
    identityProviderAlias: env.IDP_ALIAS,
    identityProviderMapper: 'oidc-user-attribute-idp-mapper',
    config: {
      syncMode: 'INHERIT',
      claim: env.IDP_SUB_CLAIM_MAPPER,
      'user.attribute': 'sub',
    },
  },
]

export const idpMapperTpl = (name: string, alias: string, role: string, claim: string): object => ({
  name,
  identityProviderAlias: alias,
  identityProviderMapper: 'oidc-role-idp-mapper',
  config: {
    syncMode: 'INHERIT',
    claim: 'groups',
    role,
    'claim.value': claim,
  },
})

export const clientScopeCfgTpl = (protocolMappers: object): object => ({
  name: 'openid',
  protocol: 'openid-connect',
  attributes: {
    'include.in.token.scope': 'true',
    'display.on.consent.screen': 'true',
  },
  protocolMappers,
})

export const protocolMappersList: Array<object> = [
  {
    name: 'groups',
    protocol: 'openid-connect',
    protocolMapper: 'oidc-usermodel-realm-role-mapper',
    consentRequired: false,
    config: {
      multivalued: 'true',
      'userinfo.token.claim': 'true',
      'user.attribute': '',
      'id.token.claim': 'true',
      'access.token.claim': 'true',
      'claim.name': 'groups',
      'jsonType.label': 'String',
    },
  },
  {
    name: 'email',
    protocol: 'openid-connect',
    protocolMapper: 'oidc-usermodel-property-mapper',
    consentRequired: false,
    config: {
      'userinfo.token.claim': 'true',
      'user.attribute': 'email',
      'id.token.claim': 'true',
      'access.token.claim': 'true',
      'claim.name': 'email',
      'jsonType.label': 'String',
    },
  },
  {
    name: 'realm roles',
    protocol: 'openid-connect',
    protocolMapper: 'oidc-usermodel-realm-role-mapper',
    consentRequired: false,
    config: {
      'user.attribute': '',
      'access.token.claim': 'true',
      'claim.name': 'realm_access.roles',
      'jsonType.label': 'String',
      multivalued: 'true',
    },
  },
  {
    name: 'client roles',
    protocol: 'openid-connect',
    protocolMapper: 'oidc-usermodel-client-role-mapper',
    consentRequired: false,
    config: {
      'user.attribute': '',
      'access.token.claim': 'true',
      'claim.name': 'resource_access.${client_id}.roles',
      'jsonType.label': 'String',
      multivalued: 'true',
    },
  },
  {
    name: 'username',
    protocol: 'openid-connect',
    protocolMapper: 'oidc-usermodel-property-mapper',
    consentRequired: false,
    config: {
      'userinfo.token.claim': 'true',
      'user.attribute': 'username',
      'id.token.claim': 'true',
      'access.token.claim': 'true',
      'claim.name': 'preferred_username',
      'jsonType.label': 'String',
    },
  },
]

export const roleTpl = (name: string, groupMapping: string, containerId: string): object => ({
  name,
  description: `Mapped for incoming IDP GROUP_ID: ${groupMapping}`,
  composite: false,
  clientRole: false,
  containerId,
  attributes: {},
})

export const clientEmailClaimMapper = (): object => ({
  name: 'email',
  protocol: 'openid-connect',
  protocolMapper: 'oidc-usermodel-property-mapper',
  consentRequired: false,
  config: {
    'userinfo.token.claim': 'true',
    'user.attribute': 'email',
    'id.token.claim': 'true',
    'access.token.claim': 'true',
    'claim.name': 'email',
    'jsonType.label': 'String',
  },
})

export const oidcCfg = (
  providerCfg: OidcProviderCfg,
  tenantId: string,
  clientId: string,
  clientSecret: string,
): object => ({
  userInfoUrl: providerCfg.userinfo_endpoint,
  validateSignature: 'true',
  clientId,
  tokenUrl: providerCfg.token_endpoint,
  jwksUrl: providerCfg.jwks_uri,
  issuer: providerCfg.issuer,
  useJwksUrl: `true`,
  authorizationUrl: providerCfg.authorization_endpoint,
  clientAuthMethod: `client_secret_post`,
  logoutUrl: providerCfg.end_session_endpoint,
  syncMode: 'FORCE',
  clientSecret,
  defaultScope: 'openid email profile',
})

export async function getDiscoveryUrls(oidcUrl: string, version = 'v2.0'): Promise<OidcProviderCfg> {
  const response = await axios.get(`${oidcUrl}${version}/.well-known/openid-configuration`)
  if (!response.data) throw Error('Oidc Provider Address not found!')
  return response.data
}

export const idpProviderCfgTpl = async (
  alias: string,
  tenantId: string,
  clientId: string,
  clientSecret: string,
  oidcUrl: string,
): Promise<object> => {
  // currently tested only on Azure AD
  const oidcCfgObj = await getDiscoveryUrls(oidcUrl)
  return {
    alias,
    displayName: alias,
    providerId: 'oidc',
    enabled: true,
    trustEmail: true,
    firstBrokerLoginFlowAlias: 'first broker login',
    config: oidcCfg(oidcCfgObj, tenantId, clientId, clientSecret),
  }
}

export const otomiClientCfgTpl = (secret: string, redirectUris: object): object => ({
  id: 'otomi',
  secret,
  defaultClientScopes: ['openid', 'email', 'profile'],
  redirectUris,
  standardFlowEnabled: true,
  implicitFlowEnabled: true,
  directAccessGrantsEnabled: true,
  serviceAccountsEnabled: true,
  authorizationServicesEnabled: true,
})

// type definition for imported ENV variable IDP_GROUP_MAPPINGS_TEAMS
export type TeamMapping = {
  name: string
  groupMapping: string
}

// type definition for OIDC Discovery URI Object Metadata
export type OidcProviderCfg = {
  jwks_uri: string
  token_endpoint: string
  issuer: string
  userinfo_endpoint: string
  authorization_endpoint: string
  end_session_endpoint: string
}
