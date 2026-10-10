#!/usr/bin/env bash
set -euo pipefail
# No shell tracing: never echo access tokens or secret material.
mode=${1:-plan}
parameter_file=${2:-infra/azure/parameters.local.json}
subscription_id=e7ab0c25-090c-4159-b2c2-9d401e356796
resource_group=rg-adote1
case "$mode" in plan|validate|apply) ;; *) echo 'Uso: bash scripts/azure-deploy.sh plan|validate|apply [parameters.local.json]' >&2; exit 2;; esac
python3 - "$parameter_file" <<'PY'
import ipaddress, json, re, sys
p = json.load(open(sys.argv[1]))['parameters']
if p.get('enableApplication', {}).get('value') and not p.get('enableContainerEnvironment', {}).get('value', True):
    raise SystemExit('Aplicação exige enableContainerEnvironment=true.')
for name in ['apiImage','webImage']:
    if not re.fullmatch(r'adote1-emajexd8e5cvf4b9\.azurecr\.io/emprego-social/(api|web)@sha256:[a-f0-9]{64}', p[name]['value']):
        raise SystemExit('Informe digests válidos das imagens atualizadas, não tags mutáveis.')
address = ipaddress.ip_address(p['operatorIpv4']['value'])
if address.version != 4 or not address.is_global: raise SystemExit('Informe o IPv4 público autorizado do operador.')
if not re.fullmatch(r'[a-fA-F0-9-]{36}', p['operatorObjectId']['value']): raise SystemExit('Object ID do operador inválido.')
if p.get('runtimeSecrets', {}).get('value'): raise SystemExit('Adicione referências de secrets somente após revisar os nomes e RBAC no Bicep; este roteiro inicial não precisa de secrets estáticos.')
PY
active_subscription=$(az account show --query id --output tsv)
if [ "$active_subscription" != "$subscription_id" ]; then echo 'Assinatura ativa diferente da assinatura do projeto.' >&2; exit 1; fi
deployment_region=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["parameters"]["location"]["value"])' "$parameter_file")
permitted_version=$(az postgres flexible-server list-skus --location "$deployment_region" --query "[0].supportedServerVersions[?name=='17'].name | [0]" --output tsv --only-show-errors)
if [ "$permitted_version" != '17' ]; then echo 'A assinatura não permite PostgreSQL 17 nesta região. Revise list-skus antes de criar recursos.' >&2; exit 1; fi
compiled_template=$(mktemp /tmp/adote1-template.XXXXXX)
trap 'rm -f "$compiled_template"' EXIT
if [ -n "${BICEP_BIN:-}" ]; then
  "$BICEP_BIN" build infra/azure/main.bicep --outfile "$compiled_template"
else
  az bicep build --file infra/azure/main.bicep --outfile "$compiled_template"
fi
case "$mode" in
  validate) az deployment group validate --subscription "$subscription_id" --resource-group "$resource_group" --template-file "$compiled_template" --parameters "@$parameter_file" --only-show-errors --output none ;;
  plan) az deployment group what-if --subscription "$subscription_id" --resource-group "$resource_group" --template-file "$compiled_template" --parameters "@$parameter_file" --result-format ResourceIdOnly ;;
  apply) az deployment group create --subscription "$subscription_id" --resource-group "$resource_group" --name adote1-production --mode Incremental --template-file "$compiled_template" --parameters "@$parameter_file" --query properties.outputs --output json ;;
esac
