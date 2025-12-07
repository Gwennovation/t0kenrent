import type { NextApiRequest, NextApiResponse } from 'next'
import connectDB, { isMockMode } from '@/lib/mongodb'
import { Rental, RentalAsset, User } from '@/models'
import { storage } from '@/lib/storage'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      assetId,
      asset: providedAsset, // Accept asset data for demo mode
      renterKey,
      startDate,
      endDate,
      rentalDays,
      rentalFee,
      depositAmount,
      totalAmount,
      paymentTxId,
      escrowTxId
    } = req.body

    // Validate required fields
    if (!assetId || !renterKey || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Connect to MongoDB
    await connectDB()

    if (isMockMode()) {
      console.log('📦 Using in-memory storage for rental creation')
      
      // Get the asset (try storage first, then use provided asset)
      let asset = storage.getAssetById(assetId)
      
      if (!asset && providedAsset) {
        // Use provided asset data (for demo mode where server-side storage is empty)
        asset = providedAsset
        // Store it temporarily for this request
        storage.createAsset(providedAsset)
      }
      
      if (!asset) {
        return res.status(404).json({ error: 'Asset not found. Please provide asset data.' })
      }

      // Skip status check if asset is provided (demo mode)
      if (!providedAsset && asset.status !== 'available') {
        return res.status(400).json({ error: 'Asset is not available for rent' })
      }

      // Ensure renter exists
      storage.getOrCreateUser(renterKey)

      // Create the rental with on-chain transaction IDs
      const rental = storage.createRental({
        assetId,
        assetName: asset.name,
        renterKey,
        ownerKey: asset.ownerKey,
        startDate,
        endDate,
        rentalDays: rentalDays || Math.ceil(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
        ),
        rentalFee: rentalFee || asset.rentalRatePerDay * rentalDays,
        depositAmount: depositAmount || asset.depositAmount,
        totalAmount: totalAmount || (rentalFee + depositAmount),
        status: 'active',
        pickupLocation: asset.rentalDetails?.pickupLocation?.address,
        accessCode: asset.rentalDetails?.accessCode,
        paymentTxId: paymentTxId || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        escrowTxId: escrowTxId || `esc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      })

      return res.status(201).json({
        success: true,
        rental: {
          id: rental.id,
          escrowId: rental.escrowId,
          assetId: rental.assetId,
          assetName: rental.assetName,
          startDate: rental.startDate,
          endDate: rental.endDate,
          rentalDays: rental.rentalDays,
          rentalFee: rental.rentalFee,
          depositAmount: rental.depositAmount,
          totalAmount: rental.totalAmount,
          status: rental.status,
          pickupLocation: rental.pickupLocation,
          accessCode: rental.accessCode,
          createdAt: rental.createdAt,
          paymentTxId: rental.paymentTxId,
          escrowTxId: rental.escrowTxId
        }
      })
    }

    // ========== MONGODB MODE ==========
    console.log('💾 Using MongoDB for rental creation')

    // Find the asset in MongoDB
    const asset = await RentalAsset.findOne({ 
      $or: [{ _id: assetId }, { tokenId: assetId }] 
    })

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found in database' })
    }

    if (asset.status !== 'available') {
      return res.status(400).json({ error: 'Asset is not available for rent' })
    }

    // Ensure renter exists
    // Determine wallet type from renterKey format
    const walletType = renterKey.startsWith('demo') ? 'demo' : 
                      renterKey.includes('@') ? 'paymail' : 'handcash'
    
    let renter = await User.findOne({ publicKey: renterKey })
    if (!renter) {
      renter = await User.create({
        publicKey: renterKey,
        walletType,
        totalListings: 0,
        totalRentals: 0,
        totalEarnings: 0,
        totalSpent: 0
      })
    }

    // Calculate rental days if not provided
    const calculatedRentalDays = rentalDays || Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    )

    const calculatedRentalFee = rentalFee || asset.rentalRatePerDay * calculatedRentalDays
    const calculatedDepositAmount = depositAmount || asset.depositAmount
    const calculatedTotalAmount = totalAmount || (calculatedRentalFee + calculatedDepositAmount)

    // Create the rental in MongoDB
    const rental = await Rental.create({
      assetId: asset._id.toString(),
      assetName: asset.name,
      renterKey,
      ownerKey: asset.ownerKey,
      startDate,
      endDate,
      rentalDays: calculatedRentalDays,
      rentalFee: calculatedRentalFee,
      depositAmount: calculatedDepositAmount,
      totalAmount: calculatedTotalAmount,
      status: 'active',
      pickupLocation: asset.rentalDetails?.pickupLocation?.address,
      accessCode: asset.rentalDetails?.accessCode,
      paymentTxId: paymentTxId || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      escrowTxId: escrowTxId || `esc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    })

    // Update asset status to 'rented'
    asset.status = 'rented'
    asset.totalRentals = (asset.totalRentals || 0) + 1
    await asset.save()

    // Update renter stats
    renter.totalRentals = (renter.totalRentals || 0) + 1
    renter.totalSpent = (renter.totalSpent || 0) + calculatedTotalAmount
    await renter.save()

    console.log(`✅ Rental created in MongoDB: ${rental._id}`)

    return res.status(201).json({
      success: true,
      rental: {
        id: rental._id.toString(),
        escrowId: `escrow_${rental._id}`,
        assetId: rental.assetId,
        assetName: rental.assetName,
        startDate: rental.startDate,
        endDate: rental.endDate,
        rentalDays: rental.rentalDays,
        rentalFee: rental.rentalFee,
        depositAmount: rental.depositAmount,
        totalAmount: rental.totalAmount,
        status: rental.status,
        pickupLocation: rental.pickupLocation,
        accessCode: rental.accessCode,
        createdAt: rental.createdAt,
        paymentTxId: rental.paymentTxId,
        escrowTxId: rental.escrowTxId
      }
    })

  } catch (error: any) {
    console.error('Rental creation error:', error)
    return res.status(500).json({ 
      error: 'Failed to create rental',
      message: error.message 
    })
  }
}
