#!/usr/bin/env bash
set -euo pipefail

# Deploy the Anchor Solana program to the configured cluster.
# Requires: SOLANA_RPC_URL and SOLANA_KEYPAIR (or default solana CLI key)

echo "Building Solana program..."
pushd programs/oft-adapter > /dev/null
anchor build
popd > /dev/null

echo "Deploying to Solana cluster: ${SOLANA_RPC_URL:-$(solana config get | grep URL | awk '{print $2}') }"

if [ -z "${SOLANA_PROGRAM_KEYPAIR:-}" ]; then
  echo "Generating program keypair..."
  mkdir -p target/deploy
  solana-keygen new -o programs/oft-adapter/target/deploy/oft_adapter-keypair.json --no-passphrase
  PROGRAM_KEYPAIR=programs/oft-adapter/target/deploy/oft_adapter-keypair.json
else
  PROGRAM_KEYPAIR=${SOLANA_PROGRAM_KEYPAIR}
fi

PROGRAM_ID=$(solana-keygen pubkey "$PROGRAM_KEYPAIR")
echo "Using program id: $PROGRAM_ID"

# Update Anchor.toml program id if necessary (manual step recommended)

echo "Deploying program via Anchor..."
cd programs/oft-adapter
anchor deploy
cd - > /dev/null

echo "Deployment complete. Please update your .env with SOLANA_PROGRAM_ID=$PROGRAM_ID and verify Anchor.toml.
"
