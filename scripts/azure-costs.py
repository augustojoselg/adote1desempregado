#!/usr/bin/env python3
"""Read public USD retail meters; no Azure credentials or resource mutations."""
import json
import sys
import urllib.parse
import subprocess
from datetime import datetime, timezone
region = sys.argv[1] if len(sys.argv) > 1 else 'eastus2'
services = ['Azure Database for PostgreSQL', 'Container Registry', 'Key Vault', 'Azure Container Apps', 'Virtual Network']
result = {'checked_at': datetime.now(timezone.utc).isoformat(), 'region': region, 'currency': 'USD', 'meters': []}
for service in services:
    query = f"serviceName eq '{service}' and armRegionName eq '{region}' and priceType eq 'Consumption'"
    url = 'https://prices.azure.com/api/retail/prices?' + urllib.parse.urlencode({'$filter': query, 'currencyCode': "'USD'"})
    while url:
        page = json.loads(subprocess.check_output(['curl', '--fail', '--silent', '--show-error', '--max-time', '60', url], text=True))
        for item in page['Items']:
            sku = item.get('skuName', '')
            meter = item.get('meterName', '')
            product = item.get('productName', '')
            if service == 'Azure Database for PostgreSQL' and not any(term in f'{sku} {meter} {product}'.lower() for term in ['b1ms', 'storage', 'backup']):
                continue
            if service == 'Container Registry' and not any(term in f'{sku} {meter}' for term in ['Basic', 'Standard']):
                continue
            if service == 'Virtual Network' and 'IPv4' not in meter:
                continue
            result['meters'].append({key: item.get(key) for key in ['serviceName', 'productName', 'skuName', 'meterName', 'armSkuName', 'unitOfMeasure', 'retailPrice', 'currencyCode', 'effectiveStartDate']})
        url = page.get('NextPageLink')
print(json.dumps(result, ensure_ascii=False, indent=2))
