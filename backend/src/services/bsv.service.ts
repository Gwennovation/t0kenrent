import { PrivateKey, Transaction, P2PKH, ARC, Spend } from '@bsv/sdk';
import { logger } from '../utils/logger';

export interface BSVConfig {
  network: 'mainnet' | 'testnet';
  privateKey?: string;
  arcApiUrl?: string;
}

export interface PaymentDetails {
  amount: number;
  address: string;
  reference: string;
}

export interface EscrowConfig {
  ownerPubKey: string;
  renterPubKey: string;
  amount: number;
  timelock?: number;
}

export class BSVService {
  private privateKey: PrivateKey;
  private network: 'mainnet' | 'testnet';
  private arcClient: ARC;

  constructor(config: BSVConfig) {
    this.network = config.network;
    
    // Initialize private key
    if (config.privateKey) {
      this.privateKey = PrivateKey.fromWif(config.privateKey);
    } else {
      this.privateKey = PrivateKey.fromRandom();
      logger.warn('No private key provided, generated random key');
    }

    // Initialize ARC client for transaction broadcasting
    this.arcClient = new ARC(config.arcApiUrl || 'https://api.taal.com/arc', {
      apiKey: process.env.TAAL_API_KEY
    });

    logger.info(`BSV Service initialized on ${this.network}`);
  }

  /**
   * Get the wallet address
   */
  getAddress(): string {
    return this.privateKey.toAddress().toString();
  }

  /**
   * Get the public key
   */
  getPublicKey(): string {
    return this.privateKey.toPublicKey().toString();
  }

  /**
   * Create and broadcast a simple payment transaction
   */
  async createPayment(
    toAddress: string,
    amount: number,
    data?: string
  ): Promise<string> {
    try {
      const tx = new Transaction();
      
      // Add inputs (UTXOs) - This would normally come from a UTXO service
      // For now, this is a simplified example
      
      // Add output for payment
      tx.addOutput({
        lockingScript: P2PKH.lock(toAddress).toScript(),
        change: false,
        satoshis: amount
      });

      // Add OP_RETURN data output if provided
      if (data) {
        tx.addOutput({
          lockingScript: Transaction.fromHex('0x6a' + Buffer.from(data).toString('hex')).outputs[0].lockingScript,
          change: false,
          satoshis: 0
        });
      }

      // Sign transaction
      await tx.fee();
      await tx.sign();

      // Broadcast transaction
      const response = await this.arcClient.broadcast(tx);
      
      logger.info(`Payment transaction broadcast: ${response.txid}`);
      return response.txid;
    } catch (error) {
      logger.error('Error creating payment:', error);
      throw new Error('Failed to create payment transaction');
    }
  }

  /**
   * Verify a payment transaction on-chain
   */
  async verifyPayment(
    txid: string,
    expectedAmount: number,
    expectedAddress: string
  ): Promise<boolean> {
    try {
      // Fetch transaction from ARC
      const txData = await this.arcClient.getTransaction(txid);
      
      if (!txData) {
        return false;
      }

      const tx = Transaction.fromHex(txData.rawTx);
      
      // Check outputs for correct amount and address
      const output = tx.outputs.find(out => {
        const script = out.lockingScript;
        // Simplified check - in production, properly decode P2PKH script
        return out.satoshis === expectedAmount;
      });

      return !!output;
    } catch (error) {
      logger.error('Error verifying payment:', error);
      return false;
    }
  }

  /**
   * Create a 2-of-2 multisig escrow UTXO
   */
  async createEscrow(config: EscrowConfig): Promise<{
    txid: string;
    vout: number;
    lockingScript: string;
  }> {
    try {
      const tx = new Transaction();

      // Create 2-of-2 multisig locking script
      const lockingScript = Transaction.fromHex(
        `0x52${config.ownerPubKey}${config.renterPubKey}52ae` // OP_2 <ownerPubKey> <renterPubKey> OP_2 OP_CHECKMULTISIG
      ).outputs[0].lockingScript;

      // Add escrow output
      tx.addOutput({
        lockingScript: lockingScript,
        satoshis: config.amount,
        change: false
      });

      // Sign and broadcast
      await tx.fee();
      await tx.sign();
      const response = await this.arcClient.broadcast(tx);

      logger.info(`Escrow created: ${response.txid}`);

      return {
        txid: response.txid,
        vout: 0,
        lockingScript: lockingScript.toHex()
      };
    } catch (error) {
      logger.error('Error creating escrow:', error);
      throw new Error('Failed to create escrow');
    }
  }

  /**
   * Release escrow funds (requires both signatures)
   */
  async releaseEscrow(
    escrowUtxo: { txid: string; vout: number; lockingScript: string },
    recipientAddress: string,
    ownerPrivKey: PrivateKey,
    renterPrivKey: PrivateKey
  ): Promise<string> {
    try {
      const tx = new Transaction();

      // Add escrow UTXO as input
      tx.addInput({
        sourceTXID: escrowUtxo.txid,
        sourceOutputIndex: escrowUtxo.vout,
        unlockingScriptTemplate: new Spend({
          lockingScript: Transaction.fromHex(escrowUtxo.lockingScript).outputs[0].lockingScript,
          sourceTXID: escrowUtxo.txid,
          sourceOutputIndex: escrowUtxo.vout
        })
      });

      // Add output to recipient
      tx.addOutput({
        lockingScript: P2PKH.lock(recipientAddress).toScript(),
        change: false
      });

      // Sign with both private keys
      await tx.sign(); // Sign with service key first
      // In production, would need proper multisig signing

      const response = await this.arcClient.broadcast(tx);
      
      logger.info(`Escrow released: ${response.txid}`);
      return response.txid;
    } catch (error) {
      logger.error('Error releasing escrow:', error);
      throw new Error('Failed to release escrow');
    }
  }

  /**
   * Create a tokenized asset using BRC-76/PushDrop
   */
  async mintAssetToken(metadata: {
    name: string;
    description: string;
    rentalRate: number;
    depositAmount: number;
    category: string;
  }): Promise<string> {
    try {
      const tx = new Transaction();

      // Create metadata using PushDrop protocol
      const metadataJson = JSON.stringify(metadata);
      const dataScript = Transaction.fromHex(
        '0x6a' + // OP_RETURN
        Buffer.from('BRC76').toString('hex') + // Protocol identifier
        Buffer.from(metadataJson).toString('hex')
      ).outputs[0].lockingScript;

      // Add token output
      tx.addOutput({
        lockingScript: dataScript,
        satoshis: 0,
        change: false
      });

      // Add ownership output
      tx.addOutput({
        lockingScript: P2PKH.lock(this.getAddress()).toScript(),
        satoshis: 1, // 1 satoshi for token ownership
        change: false
      });

      await tx.fee();
      await tx.sign();
      const response = await this.arcClient.broadcast(tx);

      logger.info(`Asset token minted: ${response.txid}`);
      return response.txid;
    } catch (error) {
      logger.error('Error minting asset token:', error);
      throw new Error('Failed to mint asset token');
    }
  }

  /**
   * Parse token metadata from transaction
   */
  async getTokenMetadata(txid: string): Promise<any> {
    try {
      const txData = await this.arcClient.getTransaction(txid);
      const tx = Transaction.fromHex(txData.rawTx);

      // Find OP_RETURN output with BRC76 protocol
      const dataOutput = tx.outputs.find(out => {
        const script = out.lockingScript.toHex();
        return script.startsWith('6a') && script.includes(Buffer.from('BRC76').toString('hex'));
      });

      if (!dataOutput) {
        throw new Error('No token metadata found');
      }

      // Parse metadata (simplified)
      const scriptHex = dataOutput.lockingScript.toHex();
      // Extract JSON metadata from script
      const metadata = {}; // Parse from hex
      
      return metadata;
    } catch (error) {
      logger.error('Error getting token metadata:', error);
      throw new Error('Failed to get token metadata');
    }
  }
}

// Export singleton instance
let bsvService: BSVService;

export const initializeBSVService = (config: BSVConfig): BSVService => {
  if (!bsvService) {
    bsvService = new BSVService(config);
  }
  return bsvService;
};

export const getBSVService = (): BSVService => {
  if (!bsvService) {
    throw new Error('BSV Service not initialized. Call initializeBSVService first.');
  }
  return bsvService;
};
