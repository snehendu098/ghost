import {
  createGetAssetsMessageV2,
  createGetConfigMessageV2,
} from "@erc7824/nitrolite";

const CLEARNODE_URLS = {
  sandbox: "wss://clearnet-sandbox.yellow.com/ws",
  production: "wss://clearnet.yellow.com/ws",
};

async function checkAssets(name: string, url: string): Promise<void> {
  return new Promise((resolve) => {
    console.log("\n==================================================");
    console.log(name.toUpperCase() + ": " + url);
    console.log("==================================================");

    const ws = new WebSocket(url);
    const chainIds: number[] = [];
    let assetsReceived = 0;

    ws.onopen = () => {
      ws.send(createGetConfigMessageV2());
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data as string);

      // Handle initial assets broadcast (eth:0 appears here)
      if (data.res?.[1] === "assets") {
        console.log("\nInitial Assets Broadcast:");
        for (const asset of data.res[2].assets || []) {
          const isNative = asset.token === "0x0000000000000000000000000000000000000000";
          console.log(
            "  " +
              asset.symbol.padEnd(10) +
              " chain:" +
              asset.chain_id +
              " " +
              (isNative ? "(native)" : asset.token)
          );
        }
        return;
      }

      if (data.res?.[1] === "get_config") {
        console.log("\nNetworks:");
        for (const n of data.res[2].networks) {
          console.log("  Chain " + n.chain_id);
          chainIds.push(n.chain_id);
        }
        console.log("\nAssets by chain:");
        for (const chainId of chainIds) {
          ws.send(createGetAssetsMessageV2(chainId));
        }
      }

      if (data.res?.[1] === "get_assets") {
        assetsReceived++;
        const assets = data.res[2].assets;
        if (assets.length > 0) {
          const chainId = assets[0].chain_id;
          console.log("\n  Chain " + chainId + ":");
          for (const a of assets) {
            const isNative =
              a.token === "0x0000000000000000000000000000000000000000";
            console.log(
              "    " +
                a.symbol.padEnd(10) +
                " " +
                (isNative ? "(native)" : a.token),
            );
          }
        }
        if (assetsReceived >= chainIds.length) {
          ws.close();
          resolve();
        }
      }
    };

    ws.onerror = (e) => {
      console.error("Error connecting to " + name + ":", e);
      resolve();
    };

    setTimeout(() => {
      ws.close();
      resolve();
    }, 10000);
  });
}

async function main() {
  console.log("Checking supported assets on ClearNode endpoints...");
  await checkAssets("sandbox", CLEARNODE_URLS.sandbox);
  await checkAssets("production", CLEARNODE_URLS.production);
  console.log("\n==================================================");
  console.log("Done!");
}

main().catch(console.error);
