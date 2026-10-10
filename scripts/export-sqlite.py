#!/usr/bin/env python3
"""Create a consistent, private export of legacy SQLite. Never prints personal data."""
import json
import os
from pathlib import Path
import sqlite3
import sys
if len(sys.argv) != 3:
    raise SystemExit('Uso: python3 scripts/export-sqlite.py /caminho/adote.db /fora/do/repo/backup.sqlite-export.json')
source = Path(sys.argv[1]).resolve(strict=True)
output = Path(sys.argv[2]).resolve()
if output.exists():
    raise SystemExit('O destino já existe; escolha outro arquivo.')
connection = sqlite3.connect(source.as_uri() + '?mode=ro', uri=True)
snapshot = sqlite3.connect(':memory:')
connection.backup(snapshot)
connection.close()
snapshot.row_factory = sqlite3.Row
data = {table: [dict(row) for row in snapshot.execute(f'SELECT * FROM {table}')] for table in ['users', 'elos', 'jobs', 'consent_log']}
snapshot.close()
fd = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
with os.fdopen(fd, 'w') as stream:
    json.dump(data, stream, ensure_ascii=False)
print('Exportação consistente criada com permissão 0600. Proteja e remova conforme a retenção definida.')
