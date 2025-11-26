import express, { Application } from 'express';
import { PrivateKey, Transaction } from '@bsv/sdk';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import { RentalTokenMonitor } from './monitors/rental-token.monitor';
import { EscrowMonitor } from './monitors/escrow.monitor';
import { StateManager } from './state/state-manager';
import { logger } from './utils/logger';

dotenv.config();

/**
 * T0kenRent Overlay Service
 * 
 * Based on concepts from Open Run Workshop:
 * - Provides application-specific view of BSV blockchain
 * - Monitors rental tokens and escrow contracts
 * - Maintains indexed state for fast queries
 * - Implements event notification system
 * 
 * Architecture follows BSV Mandala Network Layer 2 principles
 */
export class T0kenRentOverlay {
  private app: Application;
  private wss: WebSocket.Server;
  private rentalMonitor: RentalTokenMonitor;
  private escrowMonitor: EscrowMonitor;
  private stateManager: StateManager;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.OVERLAY_PORT || '3002');
    
    // Initialize monitors
    this.rentalMonitor = new RentalTokenMonitor();
    this.escrowMonitor = new EscrowMonitor();
    this.stateManager = new StateManager();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'T0kenRent Overlay',
        uptime: process.uptime(),
        monitored_rentals: this.stateManager.getRentalCount(),
        monitored_escrows: this.stateManager.getEscrowCount()
      });
    });

    // Query rental token state
    this.app.get('/api/rental/:tokenId', async (req, res) => {
      try {
        const state = await this.stateManager.getRentalState(req.params.tokenId);
        res.json(state);
      } catch (error) {
        logger.error('Error fetching rental state:', error);
        res.status(404).json({ error: 'Rental not found' });
      }
    });

    // Query all active rentals
    this.app.get('/api/rentals/active', async (req, res) => {
      try {
        const rentals = await this.stateManager.getActiveRentals();
        res.json({ rentals, count: rentals.length });
      } catch (error) {
        logger.error('Error fetching active rentals:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Query escrow state
    this.app.get('/api/escrow/:escrowId', async (req, res) => {
      try {
        const state = await this.stateManager.getEscrowState(req.params.escrowId);
        res.json(state);
      } catch (error) {
        logger.error('Error fetching escrow state:', error);
        res.status(404).json({ error: 'Escrow not found' });
      }
    });

    // Get rental history
    this.app.get('/api/rental/:tokenId/history', async (req, res) => {
      try {
        const history = await this.stateManager.getRentalHistory(req.params.tokenId);
        res.json({ history });
      } catch (error) {
        logger.error('Error fetching rental history:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Webhook for transaction notifications
    this.app.post('/api/webhook/transaction', async (req, res) => {
      try {
        const { txid } = req.body;
        await this.processTransaction(txid);
        res.json({ success: true });
      } catch (error) {
        logger.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Processing failed' });
      }
    });
  }

  private setupWebSocket(): void {
    this.wss = new WebSocket.Server({ noServer: true });

    this.wss.on('connection', (ws: WebSocket) => {
      logger.info('New WebSocket connection established');

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          this.handleWebSocketMessage(ws, data);
        } catch (error) {
          logger.error('Invalid WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        logger.info('WebSocket connection closed');
      });
    });
  }

  private handleWebSocketMessage(ws: WebSocket, data: any): void {
    switch (data.type) {
      case 'subscribe_rental':
        this.subscribeToRental(ws, data.tokenId);
        break;
      case 'subscribe_escrow':
        this.subscribeToEscrow(ws, data.escrowId);
        break;
      case 'unsubscribe':
        // Handle unsubscribe
        break;
      default:
        logger.warn('Unknown WebSocket message type:', data.type);
    }
  }

  private subscribeToRental(ws: WebSocket, tokenId: string): void {
    // Subscribe client to rental updates
    this.rentalMonitor.on(`rental:${tokenId}:update`, (state) => {
      ws.send(JSON.stringify({
        type: 'rental_update',
        tokenId,
        state
      }));
    });

    logger.info(`Client subscribed to rental ${tokenId}`);
  }

  private subscribeToEscrow(ws: WebSocket, escrowId: string): void {
    // Subscribe client to escrow updates
    this.escrowMonitor.on(`escrow:${escrowId}:update`, (state) => {
      ws.send(JSON.stringify({
        type: 'escrow_update',
        escrowId,
        state
      }));
    });

    logger.info(`Client subscribed to escrow ${escrowId}`);
  }

  /**
   * Process a new transaction
   * Implements workshop pattern for transaction parsing and indexing
   */
  private async processTransaction(txid: string): Promise<void> {
    try {
      logger.info(`Processing transaction: ${txid}`);

      // Fetch transaction from BSV network
      // In production, use ARC or other reliable service
      const tx = await this.fetchTransaction(txid);

      // Check if it's a rental token transaction
      if (this.rentalMonitor.isRentalTransaction(tx)) {
        await this.rentalMonitor.processRentalTransaction(tx);
      }

      // Check if it's an escrow transaction
      if (this.escrowMonitor.isEscrowTransaction(tx)) {
        await this.escrowMonitor.processEscrowTransaction(tx);
      }

      logger.info(`Transaction ${txid} processed successfully`);
    } catch (error) {
      logger.error(`Error processing transaction ${txid}:`, error);
      throw error;
    }
  }

  private async fetchTransaction(txid: string): Promise<Transaction> {
    // TODO: Implement actual transaction fetching from ARC/TAAL
    // This is a placeholder
    throw new Error('Not implemented - connect to ARC service');
  }

  /**
   * Start monitoring the blockchain
   * Implements workshop pattern for continuous monitoring
   */
  private async startMonitoring(): Promise<void> {
    logger.info('Starting blockchain monitoring...');

    // Start rental token monitor
    await this.rentalMonitor.start();

    // Start escrow monitor
    await this.escrowMonitor.start();

    // Connect to BSV network event stream
    // In production, use WhatsOnChain/TAAL/ARC websocket
    this.connectToBlockchainStream();

    logger.info('Blockchain monitoring started');
  }

  private connectToBlockchainStream(): void {
    // TODO: Implement actual blockchain stream connection
    // This would connect to a service like:
    // - TAAL Arc streaming API
    // - WhatsOnChain websocket
    // - Custom BSV node ZMQ
    
    logger.info('Connected to blockchain stream (placeholder)');
  }

  /**
   * Start the overlay service
   */
  public async start(): Promise<void> {
    try {
      // Initialize state manager
      await this.stateManager.initialize();

      // Start monitoring
      await this.startMonitoring();

      // Start HTTP server
      const server = this.app.listen(this.port, () => {
        logger.info(`🚀 T0kenRent Overlay Service running on port ${this.port}`);
        logger.info(`📊 Dashboard: http://localhost:${this.port}/health`);
        logger.info(`🔍 Monitoring BSV ${process.env.BSV_NETWORK || 'testnet'}`);
      });

      // Attach WebSocket server to HTTP server
      server.on('upgrade', (request, socket, head) => {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request);
        });
      });

    } catch (error) {
      logger.error('Failed to start overlay service:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  public async stop(): Promise<void> {
    logger.info('Shutting down overlay service...');

    await this.rentalMonitor.stop();
    await this.escrowMonitor.stop();
    await this.stateManager.close();

    this.wss.close();
    
    logger.info('Overlay service stopped');
  }
}

// Start service if run directly
if (require.main === module) {
  const overlay = new T0kenRentOverlay();
  
  overlay.start().catch((error) => {
    logger.error('Fatal error:', error);
    process.exit(1);
  });

  // Graceful shutdown handlers
  process.on('SIGTERM', async () => {
    await overlay.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await overlay.stop();
    process.exit(0);
  });
}

export default T0kenRentOverlay;
