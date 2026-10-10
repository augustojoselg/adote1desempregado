targetScope = 'resourceGroup'

@description('Select a region permitted by the subscription. eastus and eastus2 were restricted during deployment.')
param location string = 'centralus'
param prefix string = 'adote1p'
param acrName string = 'adote1'
@description('Immutable full references: repository@sha256:digest. New PG-compatible images are required.')
param apiImage string
param webImage string
@description('Your IPv4 address without /32. Web preview and Key Vault administration are restricted to it.')
param operatorIpv4 string
@description('Entra object ID of the operator permitted to manage Key Vault secrets.')
param operatorObjectId string
@description('First deploy false, run and verify the migration job, then deploy true.')
param enableApplication bool = false
@description('False provisions database, network and identities while an old Container Apps environment is being deleted.')
param enableContainerEnvironment bool = true
@description('Optional versionless Key Vault secret references: [{name: smtp-token, envName: SMTP_TOKEN}]. Never values.')
param runtimeSecrets array = []
@allowed(['Standard_B1ms', 'Standard_B2s'])
param postgresSku string = 'Standard_B1ms'
@minValue(0)
@maxValue(1)
param minReplicas int = 0

var suffix = uniqueString(resourceGroup().id)
var vaultName = 'kv-${prefix}-${suffix}'
var dbName = 'pg-${prefix}-${suffix}'
var webName = '${prefix}-web'
var apiName = '${prefix}-api'
var dbSubnetId = resourceId('Microsoft.Network/virtualNetworks/subnets', '${prefix}-vnet', 'postgres')
var appSubnetId = resourceId('Microsoft.Network/virtualNetworks/subnets', '${prefix}-vnet', 'apps')
var acrPullRole = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
var secretsUserRole = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')
var tags = { project: 'emprego-social', environment: 'preview', managedBy: 'bicep' }

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' existing = { name: acrName }
resource apiIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${prefix}-api-mi'
  location: location
  tags: tags
}
resource webIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${prefix}-web-mi'
  location: location
  tags: tags
}
resource migrationIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${prefix}-migrate-mi'
  location: location
  tags: tags
}
var identityPrincipals = [apiIdentity.properties.principalId, webIdentity.properties.principalId, migrationIdentity.properties.principalId]
var identityResourceIds = [apiIdentity.id, webIdentity.id, migrationIdentity.id]
resource pullPermissions 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for i in range(0, 3): {
  name: guid(acr.id, identityResourceIds[i], acrPullRole)
  scope: acr
  properties: { roleDefinitionId: acrPullRole, principalId: identityPrincipals[i], principalType: 'ServicePrincipal' }
}]

resource postgresNsg 'Microsoft.Network/networkSecurityGroups@2024-05-01' = {
  name: '${prefix}-postgres-nsg'
  location: location
  tags: tags
  properties: {
    securityRules: [
      {
        name: 'allow-apps-and-postgres'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefixes: ['10.42.0.0/23', '10.42.2.0/27']
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '5432'
        }
      }
      {
        name: 'allow-azure-health'
        properties: {
          priority: 110
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: 'AzureLoadBalancer'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '5432'
        }
      }
      {
        name: 'deny-other-inbound'
        properties: {
          priority: 4096
          direction: 'Inbound'
          access: 'Deny'
          protocol: '*'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '*'
        }
      }
    ]
  }
}
resource vnet 'Microsoft.Network/virtualNetworks@2024-05-01' = {
  name: '${prefix}-vnet'
  location: location
  tags: tags
  properties: {
    addressSpace: { addressPrefixes: ['10.42.0.0/16'] }
    subnets: [
      {
        name: 'apps'
        properties: {
          addressPrefix: '10.42.0.0/23'
          delegations: [{ name: 'containerapps', properties: { serviceName: 'Microsoft.App/environments' } }]
          serviceEndpoints: [{ service: 'Microsoft.KeyVault' }]
        }
      }
      {
        name: 'postgres'
        properties: {
          addressPrefix: '10.42.2.0/27'
          networkSecurityGroup: { id: postgresNsg.id }
          delegations: [{ name: 'postgres', properties: { serviceName: 'Microsoft.DBforPostgreSQL/flexibleServers' } }]
        }
      }
    ]
  }
}
resource postgresDns 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: '${prefix}.private.postgres.database.azure.com'
  location: 'global'
  tags: tags
}
resource dnsLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: postgresDns
  name: '${prefix}-link'
  location: 'global'
  properties: { registrationEnabled: false, virtualNetwork: { id: vnet.id } }
}
resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2024-08-01' = {
  name: dbName
  location: location
  tags: tags
  sku: { name: postgresSku, tier: 'Burstable' }
  properties: {
    version: '17'
    authConfig: { activeDirectoryAuth: 'Enabled', passwordAuth: 'Disabled', tenantId: tenant().tenantId }
    storage: { storageSizeGB: 32, autoGrow: 'Enabled', tier: 'P4' }
    backup: { backupRetentionDays: 7, geoRedundantBackup: 'Disabled' }
    highAvailability: { mode: 'Disabled' }
    network: { publicNetworkAccess: 'Disabled', delegatedSubnetResourceId: dbSubnetId, privateDnsZoneArmResourceId: postgresDns.id }
  }
  dependsOn: [dnsLink]
}
module postgresAdmin './postgres-admin.bicep' = {
  name: '${prefix}-pg-admin'
  params: {
    serverName: postgres.name
    principalId: migrationIdentity.properties.principalId
    principalName: migrationIdentity.name
  }
}
resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2024-08-01' = {
  parent: postgres
  name: 'emprego'
  properties: { charset: 'UTF8', collation: 'en_US.utf8' }
}
resource tls 'Microsoft.DBforPostgreSQL/flexibleServers/configurations@2024-08-01' = {
  parent: postgres
  name: 'require_secure_transport'
  properties: { value: 'on', source: 'user-override' }
}

resource vault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: vaultName
  location: location
  tags: tags
  properties: {
    tenantId: tenant().tenantId
    sku: { family: 'A', name: 'standard' }
    enableRbacAuthorization: true
    enableSoftDelete: true
    enablePurgeProtection: true
    softDeleteRetentionInDays: 90
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      bypass: 'None'
      defaultAction: 'Deny'
      ipRules: [{ value: '${operatorIpv4}/32' }]
      virtualNetworkRules: [{ id: appSubnetId, ignoreMissingVnetServiceEndpoint: false }]
    }
  }
  dependsOn: [vnet]
}
resource operatorVaultPermission 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: vault
  name: guid(vault.id, operatorObjectId, 'secrets-officer')
  properties: {
    principalId: operatorObjectId
    principalType: 'User'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'b86a8fe4-44ce-4948-aee5-eccb2c155cd7')
  }
}
resource secretResources 'Microsoft.KeyVault/vaults/secrets@2023-07-01' existing = [for secret in runtimeSecrets: {
  parent: vault
  name: secret.name
}]
resource runtimeSecretPermissions 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for (secret, i) in runtimeSecrets: {
  scope: secretResources[i]
  name: guid(vault.id, secret.name, apiIdentity.id)
  properties: { principalId: apiIdentity.properties.principalId, principalType: 'ServicePrincipal', roleDefinitionId: secretsUserRole }
}]

resource logs 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${prefix}-logs'
  location: location
  tags: tags
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
    workspaceCapping: { dailyQuotaGb: json('0.1') }
  }
}
resource environment 'Microsoft.App/managedEnvironments@2024-03-01' = if (enableContainerEnvironment) {
  name: '${prefix}-env'
  location: location
  tags: tags
  properties: {
    vnetConfiguration: { infrastructureSubnetId: appSubnetId, internal: false }
    workloadProfiles: [{ name: 'Consumption', workloadProfileType: 'Consumption' }]
    appLogsConfiguration: { destination: 'azure-monitor' }
  }
  dependsOn: [vnet]
}
resource environmentDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (enableContainerEnvironment) {
  scope: environment!
  name: '${prefix}-diagnostics'
  properties: {
    workspaceId: logs.id
    logs: [
      { category: 'ContainerAppConsoleLogs', enabled: true }
      { category: 'ContainerAppSystemLogs', enabled: true }
    ]
  }
}
var baseEnv = [
  { name: 'NODE_ENV', value: 'production' }
  { name: 'PG_AUTH', value: 'entra' }
  { name: 'PGHOST', value: postgres.properties.fullyQualifiedDomainName }
  { name: 'PGDATABASE', value: database.name }
  { name: 'PGPOOL_MAX', value: '5' }
]
var secretEnvironment = [for secret in runtimeSecrets: { name: secret.envName, secretRef: secret.name }]
var origin = enableContainerEnvironment ? 'https://${webName}.${environment!.properties.defaultDomain}' : ''
resource migration 'Microsoft.App/jobs@2024-03-01' = if (enableContainerEnvironment) {
  name: '${prefix}-migrate'
  location: location
  tags: tags
  identity: { type: 'UserAssigned', userAssignedIdentities: { '${migrationIdentity.id}': {} } }
  properties: {
    environmentId: environment!.id
    workloadProfileName: 'Consumption'
    configuration: {
      triggerType: 'Manual'
      replicaTimeout: 600
      replicaRetryLimit: 0
      manualTriggerConfig: { parallelism: 1, replicaCompletionCount: 1 }
      registries: [{ server: acr.properties.loginServer, identity: migrationIdentity.id }]
    }
    template: {
      containers: [{
        name: 'migrate'
        image: apiImage
        command: ['node', 'src/bootstrap-db.js']
        resources: { cpu: json('0.25'), memory: '0.5Gi' }
        env: concat(baseEnv, [
          { name: 'AZURE_CLIENT_ID', value: migrationIdentity.properties.clientId }
          { name: 'PGUSER', value: migrationIdentity.name }
          { name: 'RUNTIME_DB_ROLE', value: apiIdentity.name }
          { name: 'RUNTIME_IDENTITY_OBJECT_ID', value: apiIdentity.properties.principalId }
        ])
      }]
    }
  }
  dependsOn: [pullPermissions, postgresAdmin, tls]
}
resource api 'Microsoft.App/containerApps@2025-01-01' = if (enableApplication && enableContainerEnvironment) {
  name: apiName
  location: location
  tags: tags
  identity: { type: 'UserAssigned', userAssignedIdentities: { '${apiIdentity.id}': {} } }
  properties: {
    managedEnvironmentId: environment!.id
    workloadProfileName: 'Consumption'
    configuration: {
      activeRevisionsMode: 'Single'
      registries: [{ server: acr.properties.loginServer, identity: apiIdentity.id }]
      ingress: { external: false, targetPort: 3001, allowInsecure: false, transport: 'http' }
      secrets: [for secret in runtimeSecrets: {
        name: secret.name
        keyVaultUrl: '${vault.properties.vaultUri}secrets/${secret.name}'
        identity: apiIdentity.id
      }]
    }
    template: {
      scale: { minReplicas: minReplicas, maxReplicas: 1, rules: [{ name: 'http', http: { metadata: { concurrentRequests: '20' } } }] }
      containers: [{
        name: 'api'
        image: apiImage
        resources: { cpu: json('0.25'), memory: '0.5Gi' }
        env: concat(baseEnv, [
          { name: 'AZURE_CLIENT_ID', value: apiIdentity.properties.clientId }
          { name: 'PGUSER', value: apiIdentity.name }
          { name: 'PORT', value: '3001' }
          { name: 'SESSION_COOKIE_SECURE', value: 'true' }
          { name: 'FRONTEND_ORIGIN', value: origin }
          { name: 'TRUST_PROXY_HOPS', value: '1' }
        ], secretEnvironment)
        probes: [
          { type: 'Startup', httpGet: { path: '/api/health', port: 3001 }, periodSeconds: 5, failureThreshold: 60 }
          { type: 'Liveness', httpGet: { path: '/api/health', port: 3001 }, periodSeconds: 30, failureThreshold: 3 }
          { type: 'Readiness', httpGet: { path: '/api/ready', port: 3001 }, periodSeconds: 15, failureThreshold: 3 }
        ]
      }]
    }
  }
  dependsOn: [pullPermissions, runtimeSecretPermissions]
}
resource web 'Microsoft.App/containerApps@2025-01-01' = if (enableApplication && enableContainerEnvironment) {
  name: webName
  location: location
  tags: tags
  identity: { type: 'UserAssigned', userAssignedIdentities: { '${webIdentity.id}': {} } }
  properties: {
    managedEnvironmentId: environment!.id
    workloadProfileName: 'Consumption'
    configuration: {
      activeRevisionsMode: 'Single'
      registries: [{ server: acr.properties.loginServer, identity: webIdentity.id }]
      identitySettings: [{ identity: webIdentity.id, lifecycle: 'None' }]
      ingress: {
        external: true
        targetPort: 8080
        allowInsecure: false
        transport: 'http'
        ipSecurityRestrictions: [{ name: 'operator-preview', action: 'Allow', ipAddressRange: '${operatorIpv4}/32' }]
      }
    }
    template: {
      scale: { minReplicas: minReplicas, maxReplicas: 1, rules: [{ name: 'http', http: { metadata: { concurrentRequests: '20' } } }] }
      containers: [{
        name: 'web'
        image: webImage
        resources: { cpu: json('0.25'), memory: '0.5Gi' }
        env: [
          { name: 'PORT', value: '8080' }
          { name: 'API_UPSTREAM', value: 'https://${apiName}.internal.${environment!.properties.defaultDomain}' }
        ]
        probes: [
          { type: 'Startup', httpGet: { path: '/healthz', port: 8080 }, periodSeconds: 5, failureThreshold: 60 }
          { type: 'Liveness', httpGet: { path: '/healthz', port: 8080 }, periodSeconds: 30 }
          { type: 'Readiness', httpGet: { path: '/healthz', port: 8080 }, periodSeconds: 15 }
        ]
      }]
    }
  }
  dependsOn: [pullPermissions, api]
}
output webOrigin string = origin
output keyVaultName string = vault.name
output postgresHost string = postgres.properties.fullyQualifiedDomainName
output migrationJobName string = enableContainerEnvironment ? migration!.name : ''
output applicationEnabled bool = enableApplication && enableContainerEnvironment
