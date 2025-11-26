import express from 'express';
import { http402 } from '../middleware/http402.middleware';
import { authenticate } from '../middleware/auth.middleware';
import * as rentalController from '../controllers/rental.controller';

const router = express.Router();

/**
 * @route   GET /api/rental/search
 * @desc    Search for available rentals (public)
 * @access  Public
 */
router.get('/search', rentalController.searchRentals);

/**
 * @route   GET /api/rental/:id
 * @desc    Get basic rental information (public preview)
 * @access  Public
 */
router.get('/:id', rentalController.getRentalPreview);

/**
 * @route   GET /api/rental/details/:id
 * @desc    Get detailed rental information (requires HTTP 402 payment)
 * @access  Payment Required
 * 
 * This endpoint is protected by HTTP 402 Payment Required.
 * Clients must pay a small BSV micropayment to unlock detailed information
 * including: pickup location, access codes, owner contact, and special instructions.
 */
router.get(
  '/details/:id',
  http402({
    amount: parseInt(process.env.HTTP402_DEFAULT_AMOUNT || '10000'),
    description: 'Access to detailed rental information including location and access codes'
  }),
  rentalController.getRentalDetails
);

/**
 * @route   POST /api/rental/create
 * @desc    Create a new rental listing
 * @access  Private (requires authentication)
 */
router.post('/create', authenticate, rentalController.createRental);

/**
 * @route   POST /api/rental/:id/book
 * @desc    Book a rental and create escrow
 * @access  Private
 */
router.post('/:id/book', authenticate, rentalController.bookRental);

/**
 * @route   POST /api/rental/:id/complete
 * @desc    Complete rental and release escrow
 * @access  Private
 */
router.post('/:id/complete', authenticate, rentalController.completeRental);

/**
 * @route   POST /api/rental/:id/dispute
 * @desc    File a dispute for a rental
 * @access  Private
 */
router.post('/:id/dispute', authenticate, rentalController.fileDispute);

/**
 * @route   GET /api/rental/user/active
 * @desc    Get user's active rentals
 * @access  Private
 */
router.get('/user/active', authenticate, rentalController.getActiveRentals);

/**
 * @route   GET /api/rental/user/history
 * @desc    Get user's rental history
 * @access  Private
 */
router.get('/user/history', authenticate, rentalController.getRentalHistory);

/**
 * @route   PUT /api/rental/:id
 * @desc    Update rental listing
 * @access  Private (owner only)
 */
router.put('/:id', authenticate, rentalController.updateRental);

/**
 * @route   DELETE /api/rental/:id
 * @desc    Delete rental listing
 * @access  Private (owner only)
 */
router.delete('/:id', authenticate, rentalController.deleteRental);

export default router;
