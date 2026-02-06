# Adding Custom Assets & Chains

## Add a new blockchain

1. Add chain entry to `nitrolite/clearnode/config/compose/custom/blockchains.yaml`:
```yaml
- name: my_chain
  id: 12345
  contract_addresses:
    balance_checker: "0x..."
```

2. Add RPC env var to `nitrolite/clearnode/config/compose/custom/.env`:
```env
MY_CHAIN_BLOCKCHAIN_RPC="wss://my-chain-rpc.example.com"
```
Convention: `{NAME_UPPER}_BLOCKCHAIN_RPC` where name matches `blockchains.yaml`.

3. Pass env var through in `docker-compose.custom.yml` clearnode environment section.

## Add a new asset

1. Add asset to `nitrolite/clearnode/config/compose/custom/assets.yaml`:
```yaml
  - name: "My Token"
    symbol: "mytoken"
    tokens:
      - blockchain_id: 12345
        address: "0x..."
        decimals: 18
```

2. Seed the token in db-init SQL (in `docker-compose.custom.yml`):
```sql
INSERT INTO assets (token, chain_id, symbol, decimals)
VALUES ('0x...', 12345, 'mytoken', 18);
```

3. Update `channel/src/session.ts` asset constants if using in swaps.

## Apply changes

```bash
cd nitrolite
docker-compose -f docker-compose.custom.yml down -v
docker-compose -f docker-compose.custom.yml up -d
```

`-v` flag drops the postgres volume so db-init re-seeds. Omit if you only changed clearnode config (not DB seeds).
