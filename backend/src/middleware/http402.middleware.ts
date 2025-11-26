import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getBSVService } from '../services/bsv.service';
import { logger } from '../utils/logger';
import { redis } from '../config/redis';

export interface PaymentRequiredOptions {
  amount: number; // Amount in satoshis
  description: string;
  expiresIn?: number; // Expiration time in seconds (default: 300 = 5 minutes)
}

interface PaymentReference {
  id: string;
  amount: number;
  address: string;
  resourceId: string;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * HTTP 402 Payment Required Middleware
 * 
 * This middleware implements the HTTP 402 "Payment Required" status code
 * to gate access to protected resources behind BSV micropayments.
 * 
 * Usage:
 *   app.get('/api/rental/details/:id', 
 *     http402({ amount: 10000, description: 'Rental details access' }),
 *     rentalDetailsController
 *   );
 */
export const http402 = (options: PaymentRequiredOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { amount, description, expiresIn = 300 } = options;
      
      // Check if payment has already been made
      const accessToken = req.headers['x-access-token'] as string;
      
      if (accessToken) {
        // Verify access token
        const isValid = await verifyAccessToken(accessToken, req.path);
        if (isValid) {
          logger.info(`Valid access token provided for ${req.path}`);
          return next();
        }
      }

      // Check if payment transaction is provided
      const paymentTxId = req.headers['x-payment-txid'] as string;
      const paymentReference = req.headers['x-payment-reference'] as string;

      if (paymentTxId && paymentReference) {
        // Verify the payment
        const isValid = await verifyPayment(paymentTxId, paymentReference, amount);
        
        if (isValid) {
          // Generate access token
          const token = await generateAccessToken(req.path, paymentReference);
          
          // Add access token to response headers
          res.setHeader('X-Access-Token', token);
          res.setHeader('X-Access-Token-Expires-In', '1800'); // 30 minutes
          
          logger.info(`Payment verified for ${req.path}, txid: ${paymentTxId}`);
          return next();
        }
      }

      // No valid payment - return 402 Payment Required
      const paymentRef = await createPaymentReference(req.path, amount, expiresIn);
      
      res.status(402).json({
        error: 'Payment Required',
        message: description,
        payment: {
          currency: 'BSV',
          amount: amount,
          amountUSD: (amount / 100000000) * parseFloat(process.env.BSV_PRICE_USD || '50'),
          address: paymentRef.address,
          reference: paymentRef.id,
          expiresIn: expiresIn,
          expiresAt: paymentRef.expiresAt
        },
        instructions: {
          step1: 'Send the exact BSV amount to the provided address',
          step2: 'Include the payment reference in your transaction',
          step3: 'Retry the request with X-Payment-TxId and X-Payment-Reference headers',
          step4: 'Alternatively, use the returned X-Access-Token for future requests'
        }
      });

    } catch (error) {
      logger.error('Error in HTTP 402 middleware:', error);
      next(error);
    }
  };
};

/**
 * Create a payment reference for tracking
 */
async function createPaymentReference(
  resourcePath: string,
  amount: number,
  expiresIn: number
): Promise<PaymentReference> {
  const bsvService = getBSVService();
  const reference: PaymentReference = {
    id: `pay_${uuidv4()}`,
    amount: amount,
    address: bsvService.getAddress(),
    resourceId: resourcePath,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + expiresIn * 1000)
  };

  // Store in Redis with expiration
  await redis.setex(
    `payment:ref:${reference.id}`,
    expiresIn,
    JSON.stringify(reference)
  );

  logger.info(`Created payment reference: ${reference.id} for ${resourcePath}`);
  return reference;
}

/**
 * Verify a payment transaction
 */
async function verifyPayment(
  txId: string,
  referenceId: string,
  expectedAmount: number
): Promise<boolean> {
  try {
    // Check if payment has already been verified (prevent replay)
    const alreadyVerified = await redis.get(`payment:verified:${txId}`);
    if (alreadyVerified) {
      return true;
    }

    // Get payment reference from Redis
    const refData = await redis.get(`payment:ref:${referenceId}`);
    if (!refData) {
      logger.warn(`Payment reference not found or expired: ${referenceId}`);
      return false;
    }

    const reference: PaymentReference = JSON.parse(refData);

    // Verify the payment on BSV blockchain
    const bsvService = getBSVService();
    const isValid = await bsvService.verifyPayment(
      txId,
      expectedAmount,
      reference.address
    );

    if (isValid) {
      // Mark payment as verified (store for 24 hours to prevent replay)
      await redis.setex(`payment:verified:${txId}`, 86400, referenceId);
      logger.info(`Payment verified: ${txId} for reference ${referenceId}`);
      return true;
    }

    return false;
  } catch (error) {
    logger.error('Error verifying payment:', error);
    return false;
  }
}

/**
 * Generate an access token after successful payment
 */
async function generateAccessToken(
  resourcePath: string,
  paymentReference: string
): Promise<string> {
  const token = `acc_${uuidv4()}`;
  const expiresIn = 1800; // 30 minutes

  const tokenData = {
    token,
    resourcePath,
    paymentReference,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + expiresIn * 1000)
  };

  // Store in Redis
  await redis.setex(
    `access:token:${token}`,
    expiresIn,
    JSON.stringify(tokenData)
  );

  logger.info(`Generated access token: ${token} for ${resourcePath}`);
  return token;
}

/**
 * Verify an access token
 */
async function verifyAccessToken(
  token: string,
  resourcePath: string
): Promise<boolean> {
  try {
    const tokenData = await redis.get(`access:token:${token}`);
    if (!tokenData) {
      return false;
    }

    const data = JSON.parse(tokenData);
    
    // Verify resource path matches
    if (data.resourcePath !== resourcePath) {
      logger.warn(`Access token path mismatch: ${data.resourcePath} !== ${resourcePath}`);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error verifying access token:', error);
    return false;
  }
}

/**
 * Middleware to verify payment transaction in request body
 * Used for POST requests with payment data
 */
export const verifyPaymentMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { payment_txid, payment_reference, payment_amount } = req.body;

    if (!payment_txid || !payment_reference) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Payment transaction ID and reference are required'
      });
    }

    const isValid = await verifyPayment(payment_txid, payment_reference, payment_amount);

    if (!isValid) {
      return res.status(402).json({
        error: 'Payment Required',
        message: 'Invalid or unverified payment transaction'
      });
    }

    // Payment verified, continue
    req.body.paymentVerified = true;
    next();
  } catch (error) {
    logger.error('Error in payment verification middleware:', error);
    next(error);
  }
};
