import { Transaction } from '@bsv/sdk';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

/**
 * Rental Token Monitor
 * 
 * Implements Open Run Workshop concepts:
 * - Application-specific overlay for rental tokens
 * - Real-time transaction monitoring
 * - State machine for rental lifecycle
 * - Event-driven architecture
 */

export enum RentalState {
  CREATED = 'created',
  LISTED = 'listed',
  RESERVED = 'reserved',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled'
}

export interface RentalToken {
  tokenId: string;
  txid: string;
  owner: string;
  metadata: {
    name: string;
    description: string;
    category: string;
    rentalRate: number;
    depositAmount: number;
    images?: string[];
  };
  state: RentalState;
  currentRenter?: string;
  rentalPeriod?: {
    startDate: string;
    endDate: string;
  };
  escrowId?: string;
  createdAt: Date;
  updatedAt: Date;
  history: RentalEvent[];
}

export interface RentalEvent {
  type: string;
  txid: string;
  timestamp: Date;
  from?: string;
  to?: string;
  details?: any;
}

export class RentalTokenMonitor extends EventEmitter {
  private tokens: Map<string, RentalToken>;
  private protocolId: string;
  private isRunning: boolean;

  constructor() {
    super();
    this.tokens = new Map();
    this.protocolId = 'BRC76-T0KENRENT'; // Our protocol identifier
    this.isRunning = false;
  }

  /**
   * Start monitoring for rental transactions
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Rental monitor already running');
      return;
    }

    this.isRunning = true;
    logger.info('Rental token monitor started');

    // Load existing tokens from database
    await this.loadExistingTokens();
  }

  /**
   * Stop monitoring
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    logger.info('Rental token monitor stopped');
  }

  /**
   * Check if a transaction is a rental token transaction
   * Implements workshop pattern for transaction classification
   */
  isRentalTransaction(tx: Transaction): boolean {
    try {
      // Check outputs for OP_RETURN with our protocol ID
      for (const output of tx.outputs) {
        const script = output.lockingScript.toHex();
        
        // Check for OP_RETURN (0x6a) followed by our protocol ID
        if (script.startsWith('6a')) {
          const data = this.parseOpReturn(script);
          if (data.protocolId === this.protocolId) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      logger.error('Error checking rental transaction:', error);
      return false;
    }
  }

  /**
   * Process a rental token transaction
   * Implements workshop pattern for state updates
   */
  async processRentalTransaction(tx: Transaction): Promise<void> {
    try {
      const txid = tx.id('hex');
      logger.info(`Processing rental transaction: ${txid}`);

      // Parse transaction to extract rental data
      const rentalData = this.parseRentalTransaction(tx);

      // Determine transaction type
      const txType = this.determineTransactionType(tx, rentalData);

      switch (txType) {
        case 'TOKEN_MINT':
          await this.handleTokenMint(tx, rentalData);
          break;
        case 'TOKEN_TRANSFER':
          await this.handleTokenTransfer(tx, rentalData);
          break;
        case 'RENTAL_START':
          await this.handleRentalStart(tx, rentalData);
          break;
        case 'RENTAL_COMPLETE':
          await this.handleRentalComplete(tx, rentalData);
          break;
        case 'RENTAL_DISPUTE':
          await this.handleRentalDispute(tx, rentalData);
          break;
        default:
          logger.warn(`Unknown rental transaction type: ${txType}`);
      }

      logger.info(`Rental transaction ${txid} processed`);
    } catch (error) {
      logger.error('Error processing rental transaction:', error);
      throw error;
    }
  }

  /**
   * Parse OP_RETURN data from locking script
   */
  private parseOpReturn(scriptHex: string): any {
    try {
      // Remove OP_RETURN byte (6a)
      const dataHex = scriptHex.substring(2);
      
      // Parse protocol ID and data
      // Format: [protocol_id][data_length][json_data]
      const protocolIdLength = parseInt(dataHex.substring(0, 2), 16) * 2;
      const protocolId = Buffer.from(
        dataHex.substring(2, 2 + protocolIdLength),
        'hex'
      ).toString('utf-8');

      const dataLength = parseInt(dataHex.substring(2 + protocolIdLength, 4 + protocolIdLength), 16) * 2;
      const jsonData = Buffer.from(
        dataHex.substring(4 + protocolIdLength, 4 + protocolIdLength + dataLength),
        'hex'
      ).toString('utf-8');

      return {
        protocolId,
        data: JSON.parse(jsonData)
      };
    } catch (error) {
      logger.error('Error parsing OP_RETURN:', error);
      return { protocolId: null, data: null };
    }
  }

  /**
   * Parse rental transaction data
   */
  private parseRentalTransaction(tx: Transaction): any {
    for (const output of tx.outputs) {
      const script = output.lockingScript.toHex();
      if (script.startsWith('6a')) {
        const parsed = this.parseOpReturn(script);
        if (parsed.protocolId === this.protocolId) {
          return parsed.data;
        }
      }
    }
    return null;
  }

  /**
   * Determine transaction type
   */
  private determineTransactionType(tx: Transaction, data: any): string {
    if (!data) return 'UNKNOWN';

    if (data.action === 'MINT') return 'TOKEN_MINT';
    if (data.action === 'TRANSFER') return 'TOKEN_TRANSFER';
    if (data.action === 'RENTAL_START') return 'RENTAL_START';
    if (data.action === 'RENTAL_COMPLETE') return 'RENTAL_COMPLETE';
    if (data.action === 'RENTAL_DISPUTE') return 'RENTAL_DISPUTE';

    return 'UNKNOWN';
  }

  /**
   * Handle token minting
   */
  private async handleTokenMint(tx: Transaction, data: any): Promise<void> {
    const txid = tx.id('hex');
    const tokenId = `${txid}_0`; // Token ID is txid + output index

    const token: RentalToken = {
      tokenId,
      txid,
      owner: data.owner,
      metadata: data.metadata,
      state: RentalState.CREATED,
      createdAt: new Date(),
      updatedAt: new Date(),
      history: [{
        type: 'TOKEN_MINTED',
        txid,
        timestamp: new Date(),
        details: data
      }]
    };

    this.tokens.set(tokenId, token);

    // Emit event
    this.emit('rental:created', token);
    this.emit(`rental:${tokenId}:update`, token);

    logger.info(`Rental token minted: ${tokenId}`);
  }

  /**
   * Handle token transfer
   */
  private async handleTokenTransfer(tx: Transaction, data: any): Promise<void> {
    const tokenId = data.tokenId;
    const token = this.tokens.get(tokenId);

    if (!token) {
      logger.warn(`Token not found: ${tokenId}`);
      return;
    }

    const txid = tx.id('hex');

    // Update token ownership
    const previousOwner = token.owner;
    token.owner = data.newOwner;
    token.updatedAt = new Date();
    token.history.push({
      type: 'TOKEN_TRANSFERRED',
      txid,
      timestamp: new Date(),
      from: previousOwner,
      to: data.newOwner
    });

    this.tokens.set(tokenId, token);

    // Emit event
    this.emit('rental:transferred', token);
    this.emit(`rental:${tokenId}:update`, token);

    logger.info(`Rental token transferred: ${tokenId} from ${previousOwner} to ${data.newOwner}`);
  }

  /**
   * Handle rental start
   */
  private async handleRentalStart(tx: Transaction, data: any): Promise<void> {
    const tokenId = data.tokenId;
    const token = this.tokens.get(tokenId);

    if (!token) {
      logger.warn(`Token not found: ${tokenId}`);
      return;
    }

    const txid = tx.id('hex');

    // Update token state
    token.state = RentalState.ACTIVE;
    token.currentRenter = data.renter;
    token.rentalPeriod = {
      startDate: data.startDate,
      endDate: data.endDate
    };
    token.escrowId = data.escrowId;
    token.updatedAt = new Date();
    token.history.push({
      type: 'RENTAL_STARTED',
      txid,
      timestamp: new Date(),
      to: data.renter,
      details: {
        startDate: data.startDate,
        endDate: data.endDate,
        escrowId: data.escrowId
      }
    });

    this.tokens.set(tokenId, token);

    // Emit event
    this.emit('rental:started', token);
    this.emit(`rental:${tokenId}:update`, token);

    logger.info(`Rental started: ${tokenId} to ${data.renter}`);
  }

  /**
   * Handle rental completion
   */
  private async handleRentalComplete(tx: Transaction, data: any): Promise<void> {
    const tokenId = data.tokenId;
    const token = this.tokens.get(tokenId);

    if (!token) {
      logger.warn(`Token not found: ${tokenId}`);
      return;
    }

    const txid = tx.id('hex');

    // Update token state
    const previousRenter = token.currentRenter;
    token.state = RentalState.COMPLETED;
    token.currentRenter = undefined;
    token.rentalPeriod = undefined;
    token.updatedAt = new Date();
    token.history.push({
      type: 'RENTAL_COMPLETED',
      txid,
      timestamp: new Date(),
      from: previousRenter,
      details: data
    });

    this.tokens.set(tokenId, token);

    // Emit event
    this.emit('rental:completed', token);
    this.emit(`rental:${tokenId}:update`, token);

    logger.info(`Rental completed: ${tokenId}`);
  }

  /**
   * Handle rental dispute
   */
  private async handleRentalDispute(tx: Transaction, data: any): Promise<void> {
    const tokenId = data.tokenId;
    const token = this.tokens.get(tokenId);

    if (!token) {
      logger.warn(`Token not found: ${tokenId}`);
      return;
    }

    const txid = tx.id('hex');

    // Update token state
    token.state = RentalState.DISPUTED;
    token.updatedAt = new Date();
    token.history.push({
      type: 'RENTAL_DISPUTED',
      txid,
      timestamp: new Date(),
      details: {
        disputeReason: data.reason,
        disputedBy: data.disputedBy
      }
    });

    this.tokens.set(tokenId, token);

    // Emit event
    this.emit('rental:disputed', token);
    this.emit(`rental:${tokenId}:update`, token);

    logger.info(`Rental disputed: ${tokenId}`);
  }

  /**
   * Get rental token by ID
   */
  getRentalToken(tokenId: string): RentalToken | undefined {
    return this.tokens.get(tokenId);
  }

  /**
   * Get all rental tokens
   */
  getAllRentalTokens(): RentalToken[] {
    return Array.from(this.tokens.values());
  }

  /**
   * Get active rentals
   */
  getActiveRentals(): RentalToken[] {
    return Array.from(this.tokens.values()).filter(
      token => token.state === RentalState.ACTIVE
    );
  }

  /**
   * Load existing tokens from database
   * In production, this would load from MongoDB or other persistence
   */
  private async loadExistingTokens(): Promise<void> {
    // TODO: Implement database loading
    logger.info('Loaded existing rental tokens (placeholder)');
  }
}
