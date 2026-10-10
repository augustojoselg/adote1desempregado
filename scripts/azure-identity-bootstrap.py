#!/usr/bin/env python3
"""Configure the existing Entra application and place secrets directly in Key Vault.
Never prints credential responses or passes secret values in command arguments.
"""
import argparse
import base64
import datetime
import json
import os
from pathlib import Path
import secrets
import subprocess
import tempfile
import uuid

parser = argparse.ArgumentParser()
parser.add_argument('--application-object-id', required=True)
parser.add_argument('--service-principal-id', required=True)
parser.add_argument('--operator-object-id', required=True)
parser.add_argument('--vault-name', required=True)
parser.add_argument('--rotate-client-secret', action='store_true')
parser.add_argument('--rotate-cookie-key', action='store_true')
args = parser.parse_args()
for value in [args.application_object_id, args.service_principal_id, args.operator_object_id]:
    uuid.UUID(value)

def run(arguments, label):
    result = subprocess.run(['az', *arguments, '--only-show-errors'], capture_output=True, text=True)
    if result.returncode:
        raise SystemExit(f'Falha em {label}. Verifique permissões e rede pelo portal; respostas sensíveis foram omitidas.')
    return json.loads(result.stdout) if result.stdout.strip() else None

def private_file(directory, name, value):
    path = Path(directory) / name
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'w') as handle:
        handle.write(value)
    return str(path)

with tempfile.TemporaryDirectory(prefix='adote1-identity-', dir='/tmp') as directory:
    roles = [{
        'id': str(uuid.uuid5(uuid.NAMESPACE_URL, 'https://empregosocial.com.br/roles/' + name)),
        'allowedMemberTypes': ['User'], 'description': description,
        'displayName': name, 'isEnabled': True, 'value': name,
    } for name, description in [
        ('Member', 'Participante autorizado da rede'),
        ('Company', 'Representante empresarial validado pela operação'),
        ('Admin', 'Administrador da aplicação'),
    ]]
    role_file = private_file(directory, 'roles.json', json.dumps(roles))
    run(['ad', 'app', 'update', '--id', args.application_object_id, '--app-roles', '@' + role_file, '-o', 'none'], 'configuração de papéis')
    sp_file = private_file(directory, 'sp.json', json.dumps({'appRoleAssignmentRequired': True}))
    run(['rest', '--method', 'PATCH', '--uri', 'https://graph.microsoft.com/v1.0/servicePrincipals/' + args.service_principal_id,
         '--body', '@' + sp_file, '-o', 'none'], 'restrição de usuários autorizados')
    assignments = run(['rest', '--method', 'GET', '--uri', 'https://graph.microsoft.com/v1.0/servicePrincipals/' + args.service_principal_id + '/appRoleAssignedTo', '-o', 'json'], 'consulta de atribuições')
    admin_role = next(role['id'] for role in roles if role['value'] == 'Admin')
    if not any(item['principalId'] == args.operator_object_id and item['appRoleId'] == admin_role for item in assignments['value']):
        assignment_file = private_file(directory, 'assignment.json', json.dumps({
            'principalId': args.operator_object_id, 'resourceId': args.service_principal_id, 'appRoleId': admin_role,
        }))
        run(['rest', '--method', 'POST', '--uri', 'https://graph.microsoft.com/v1.0/servicePrincipals/' + args.service_principal_id + '/appRoleAssignedTo',
             '--body', '@' + assignment_file, '-o', 'none'], 'atribuição inicial do administrador')
    existing = run(['keyvault', 'secret', 'list', '--vault-name', args.vault_name, '--query', '[].name', '-o', 'json'], 'consulta de nomes no Key Vault')
    def store(name, value):
        path = private_file(directory, name, value)
        run(['keyvault', 'secret', 'set', '--vault-name', args.vault_name, '--name', name, '--file', path, '-o', 'none'], 'gravação no Key Vault')
    if 'oidc-client-secret' not in existing or args.rotate_client_secret:
        expiry = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=180)).strftime('%Y-%m-%dT%H:%M:%SZ')
        credential_file = private_file(directory, 'credential.json', json.dumps({'passwordCredential': {
            'displayName': 'adote1-keyvault', 'endDateTime': expiry,
        }}))
        credential = run(['rest', '--method', 'POST', '--uri', 'https://graph.microsoft.com/v1.0/applications/' + args.application_object_id + '/addPassword',
                          '--body', '@' + credential_file, '-o', 'json'], 'criação de credencial OIDC')
        try:
            store('oidc-client-secret', credential['secretText'])
        except BaseException:
            removal_file = private_file(directory, 'remove-credential.json', json.dumps({'keyId': credential['keyId']}))
            run(['rest', '--method', 'POST', '--uri', 'https://graph.microsoft.com/v1.0/applications/' + args.application_object_id + '/removePassword',
                 '--body', '@' + removal_file, '-o', 'none'], 'remoção de credencial não armazenada')
            raise
    expiries = run(['ad', 'app', 'credential', 'list', '--id', args.application_object_id,
                   '--query', "[?displayName=='adote1-keyvault'].endDateTime", '-o', 'json'], 'consulta de expiração OIDC')
    if expiries:
        expiry = datetime.datetime.fromisoformat(max(expiries).replace('Z', '+00:00')).strftime('%Y-%m-%dT%H:%M:%SZ')
        run(['keyvault', 'secret', 'set-attributes', '--vault-name', args.vault_name,
             '--name', 'oidc-client-secret', '--expires', expiry, '-o', 'none'], 'registro da expiração no Key Vault')
    if 'oidc-cookie-key' not in existing or args.rotate_cookie_key:
        store('oidc-cookie-key', base64.b64encode(secrets.token_bytes(32)).decode())
print('Papéis Entra e referências no Key Vault configurados; nenhum valor de segredo foi exibido.')
