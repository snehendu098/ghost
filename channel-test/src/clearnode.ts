import {
  createAuthRequestMessage,
  createAuthVerifyMessageFromChallenge,
  createEIP712AuthMessageSigner,
  createGetChannelsMessageV2,
  createGetLedgerBalancesMessage,
  createAppSessionMessage,
  createSubmitAppStateMessage,
  createCloseAppSessionMessage,
  NitroliteRPC,
  RPCMethod,
  type RPCBalance,
  type RPCChannelUpdateWithWallet,
  RPCProtocolVersion,
  type RPCAppSessionAllocation,
  type RPCAppDefinition,
  type MessageSigner,
  RPCAppStateIntent,
} from "@erc7824/nitrolite";
import { createWalletClient, http, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import type { LoadedWallet } from "./wallets.ts";

const CLEARNODE_URL =
  process.env.CLEARNODE_URL || "wss://clearnet-sandbox.yellow.com/ws";
const APP_NAME = "ghost-matcher";

interface PendingRequest {
  resolve: (data: unknown) => void;
  reject: (err: Error) => void;
}

export class ClearNodeClient {
  private ws: WebSocket | null = null;
  private wallet: LoadedWallet;
  private pending = new Map<number, PendingRequest>();
  private reqId = 1;
  private authenticated = false;

  constructor(wallet: LoadedWallet) {
    this.wallet = wallet;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(CLEARNODE_URL);

      this.ws.onopen = async () => {
        try {
          await this.authenticate();
          this.authenticated = true;
          resolve();
        } catch (e) {
          reject(e);
        }
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data as string);
      };

      this.ws.onerror = (e) => {
        reject(new Error(`WebSocket error: ${e}`));
      };

      this.ws.onclose = () => {
        this.authenticated = false;
      };
    });
  }

  private async authenticate(): Promise<void> {
    const walletAddress = this.wallet.address as Address;
    const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 86400);

    // Step 1: Send auth_request
    const authReq = await createAuthRequestMessage({
      address: walletAddress,
      session_key: walletAddress,
      application: APP_NAME,
      allowances: [],
      expires_at: expiresAt,
      scope: "console",
    });

    const challengeRes = await this.sendRaw(authReq);
    const parsed = JSON.parse(challengeRes);

    if (!parsed.res || parsed.res[1] !== "auth_challenge") {
      throw new Error(`Auth failed: ${challengeRes}`);
    }

    const challenge = parsed.res[2].challenge_message;

    // Step 2: Create EIP-712 signer and sign challenge
    const account = privateKeyToAccount(this.wallet.privateKey as Hex);
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(),
    });

    const eip712Signer = createEIP712AuthMessageSigner(
      walletClient,
      {
        scope: "console",
        session_key: walletAddress,
        expires_at: expiresAt,
        allowances: [],
      },
      { name: APP_NAME },
    );

    const verifyMsg = await createAuthVerifyMessageFromChallenge(
      eip712Signer,
      challenge,
    );

    const verifyRes = await this.sendRaw(verifyMsg);
    const verifyParsed = JSON.parse(verifyRes);

    if (!verifyParsed.res || verifyParsed.res[1] !== "auth_verify") {
      throw new Error(`Auth verify failed: ${verifyRes}`);
    }

    if (!verifyParsed.res[2].success) {
      throw new Error("Auth verify returned success=false");
    }
  }

  private handleMessage(data: string): void {
    try {
      const msg = JSON.parse(data);
      const reqId = msg.res?.[0] ?? msg.req?.[0];

      if (reqId && this.pending.has(reqId)) {
        const p = this.pending.get(reqId)!;
        this.pending.delete(reqId);

        if (msg.res?.[1] === "error") {
          p.reject(new Error(msg.res[2].error));
        } else {
          p.resolve(msg);
        }
      }
    } catch {
      // ignore parse errors for non-JSON messages
    }
  }

  private sendRaw(message: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return reject(new Error("WebSocket not connected"));
      }

      const parsed = JSON.parse(message);
      const reqId = parsed.req?.[0];

      if (reqId) {
        this.pending.set(reqId, {
          resolve: (data) => resolve(JSON.stringify(data)),
          reject,
        });
      }

      this.ws.send(message);

      if (!reqId) {
        // For messages without reqId, resolve immediately after send
        setTimeout(() => resolve(""), 100);
      }
    });
  }

  async send(message: string): Promise<unknown> {
    const res = await this.sendRaw(message);
    return JSON.parse(res);
  }

  async getChannels(): Promise<RPCChannelUpdateWithWallet[]> {
    const msg = createGetChannelsMessageV2(this.wallet.address as Address);
    const res = (await this.send(msg)) as {
      res: [number, string, { channels: RPCChannelUpdateWithWallet[] }];
    };
    return res.res[2].channels;
  }

  async getLedgerBalances(): Promise<RPCBalance[]> {
    const msg = await createGetLedgerBalancesMessage(this.wallet.signer);
    const res = (await this.send(msg)) as {
      res: [number, string, { ledger_balances: RPCBalance[] }];
    };
    return res.res[2].ledger_balances;
  }

  async createAppSession(
    participants: Address[],
    allocations: RPCAppSessionAllocation[],
    nonce?: number,
  ): Promise<Hex> {
    const definition: RPCAppDefinition = {
      application: APP_NAME,
      protocol: RPCProtocolVersion.NitroRPC_0_4,
      participants,
      weights: participants.map(() => 1),
      quorum: participants.length,
      challenge: 86400,
      nonce: nonce ?? Date.now(),
    };

    const msg = await createAppSessionMessage(this.wallet.signer, {
      definition,
      allocations,
    });

    const res = (await this.send(msg)) as {
      res: [number, string, { appSessionId: Hex }];
    };
    return res.res[2].appSessionId;
  }

  async submitAppState(
    appSessionId: Hex,
    version: number,
    allocations: RPCAppSessionAllocation[],
  ): Promise<void> {
    const msg = await createSubmitAppStateMessage(this.wallet.signer, {
      app_session_id: appSessionId,
      intent: RPCAppStateIntent.Operate,
      version,
      allocations,
    });
    await this.send(msg);
  }

  async closeAppSession(
    appSessionId: Hex,
    allocations: RPCAppSessionAllocation[],
  ): Promise<void> {
    const msg = await createCloseAppSessionMessage(this.wallet.signer, {
      app_session_id: appSessionId,
      allocations,
    });
    await this.send(msg);
  }

  async createAppSessionMultiSig(
    participants: Address[],
    allocations: RPCAppSessionAllocation[],
    signers: MessageSigner[],
    nonce?: number,
  ): Promise<Hex> {
    const definition: RPCAppDefinition = {
      application: APP_NAME,
      protocol: RPCProtocolVersion.NitroRPC_0_4,
      participants,
      weights: participants.map(() => 1),
      quorum: participants.length,
      challenge: 86400,
      nonce: nonce ?? Date.now(),
    };

    const request = NitroliteRPC.createRequest({
      method: RPCMethod.CreateAppSession,
      params: { definition, allocations },
    });

    const sigs = await Promise.all(signers.map((s) => s(request.req!)));
    request.sig = sigs;

    const res = (await this.send(JSON.stringify(request))) as {
      res: [number, string, { app_session_id: Hex }];
    };
    return res.res[2].app_session_id;
  }

  async submitAppStateMultiSig(
    appSessionId: Hex,
    version: number,
    allocations: RPCAppSessionAllocation[],
    signers: MessageSigner[],
  ): Promise<void> {
    const request = NitroliteRPC.createRequest({
      method: RPCMethod.SubmitAppState,
      params: {
        app_session_id: appSessionId,
        intent: RPCAppStateIntent.Operate,
        version,
        allocations,
      },
    });

    const sigs = await Promise.all(signers.map((s) => s(request.req!)));
    request.sig = sigs;

    await this.send(JSON.stringify(request));
  }

  async closeAppSessionMultiSig(
    appSessionId: Hex,
    allocations: RPCAppSessionAllocation[],
    signers: MessageSigner[],
  ): Promise<void> {
    const request = NitroliteRPC.createRequest({
      method: RPCMethod.CloseAppSession,
      params: {
        app_session_id: appSessionId,
        allocations,
      },
    });

    const sigs = await Promise.all(signers.map((s) => s(request.req!)));
    request.sig = sigs;

    await this.send(JSON.stringify(request));
  }

  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  get isAuthenticated(): boolean {
    return this.authenticated;
  }

  get address(): string {
    return this.wallet.address;
  }

  get signer(): MessageSigner {
    return this.wallet.signer;
  }
}
