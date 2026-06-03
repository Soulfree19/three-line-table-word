#!/usr/bin/env bash
set -euo pipefail

mkdir -p certs

openssl req \
  -x509 \
  -newkey rsa:2048 \
  -sha256 \
  -days 825 \
  -nodes \
  -keyout certs/localhost.key \
  -out certs/localhost.crt \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

cat <<'MESSAGE'

Local certificate created:
  certs/localhost.crt
  certs/localhost.key

For Word on Mac, trust the certificate in Keychain Access:
  1. Open Keychain Access.
  2. Import certs/localhost.crt into the login keychain.
  3. Open the certificate, expand Trust, set "When using this certificate" to "Always Trust".
  4. Restart Word, then run: npm run start:https

MESSAGE
