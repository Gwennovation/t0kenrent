import mongoose, { Schema, Document } from 'mongoose'

export interface IStage {
  id: string
  stageIndex: number
  title: string
  metadata: Record<string, any>
  requiresPayment: boolean
  rentAmount?: number
  txid?: string
  timestamp?: Date
  status: 'pending' | 'active' | 'paid' | 'completed'
  paymentTxid?: string
  paidAt?: Date
  paidBy?: string
}

export interface IChain extends Document {
  chainId: string
  title: string
  description?: string
  ownerKey: string
  ownerName?: string
  stages: IStage[]
  status: 'draft' | 'active' | 'completed' | 'archived'
  createdAt: Date
  updatedAt: Date
  totalStages: number
  completedStages: number
  totalPaymentsReceived: number
}

const StageSchema = new Schema<IStage>({
  id: { type: String, required: true },
  stageIndex: { type: Number, required: true },
  title: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
  requiresPayment: { type: Boolean, default: false },
  rentAmount: { type: Number, default: 0 },
  txid: { type: String },
  timestamp: { type: Date },
  status: { 
    type: String, 
    enum: ['pending', 'active', 'paid', 'completed'],
    default: 'pending'
  },
  paymentTxid: { type: String },
  paidAt: { type: Date },
  paidBy: { type: String }
})

const ChainSchema = new Schema<IChain>({
  chainId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  title: { type: String, required: true },
  description: { type: String },
  ownerKey: { 
    type: String, 
    required: true,
    index: true
  },
  ownerName: { type: String },
  stages: [StageSchema],
  status: { 
    type: String, 
    enum: ['draft', 'active', 'completed', 'archived'],
    default: 'draft'
  },
  totalStages: { type: Number, default: 0 },
  completedStages: { type: Number, default: 0 },
  totalPaymentsReceived: { type: Number, default: 0 }
}, {
  timestamps: true
})

// Indexes for efficient queries
ChainSchema.index({ ownerKey: 1, status: 1 })
ChainSchema.index({ createdAt: -1 })

// Virtual for completion percentage
ChainSchema.virtual('completionPercentage').get(function() {
  if (this.totalStages === 0) return 0
  return Math.round((this.completedStages / this.totalStages) * 100)
})

// Pre-save hook to update counters
ChainSchema.pre('save', function(next) {
  this.totalStages = this.stages.length
  this.completedStages = this.stages.filter(s => s.status === 'completed' || s.status === 'paid').length
  next()
})

export default mongoose.models.Chain || mongoose.model<IChain>('Chain', ChainSchema)
