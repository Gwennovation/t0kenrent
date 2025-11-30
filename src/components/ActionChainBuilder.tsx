import { useState, useEffect } from 'react'
import { getPublicKey } from 'babbage-sdk'
import StageCard from './StageCard'
import { rentService } from '@/lib/rentService'
import { getErrorMessage } from '@/lib/error-utils'

interface Stage {
  id: string
  title: string
  imageUrl?: string
  metadata: Record<string, any>
  requiresPayment: boolean
  rentAmount?: number
  ownerKey?: string
  duration?: number
  expiresAt?: Date
  payment?: any
  transactionId?: string
}

interface ActionChainBuilderProps {
  initialChainId?: string
  ownerKey: string
}

export default function ActionChainBuilder({
  initialChainId,
  ownerKey
}: ActionChainBuilderProps) {
  const [chainId, setChainId] = useState(initialChainId || '')
  const [chainTitle, setChainTitle] = useState('')
  const [stages, setStages] = useState<Stage[]>([])
  const [showStageForm, setShowStageForm] = useState(false)
  const [finalized, setFinalized] = useState(false)
  
  // New stage form state
  const [newStage, setNewStage] = useState({
    title: '',
    imageUrl: '',
    metadata: {} as Record<string, string>,
    requiresPayment: false,
    rentAmount: 0,
    duration: 30
  })
  
  const [metadataKey, setMetadataKey] = useState('')
  const [metadataValue, setMetadataValue] = useState('')

  useEffect(() => {
    if (initialChainId) {
      loadActionChain()
    }
  }, [initialChainId])

  async function loadActionChain() {
    try {
      const response = await fetch(`/api/chains/${initialChainId}`)
      const data = await response.json()
      
      setChainTitle(data.title)
      setStages(data.stages)
      setFinalized(data.finalized)
    } catch (error) {
      console.error('Failed to load action chain:', error)
    }
  }

  function addMetadata() {
    if (metadataKey && metadataValue) {
      setNewStage(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          [metadataKey]: metadataValue
        }
      }))
      setMetadataKey('')
      setMetadataValue('')
    }
  }

  function removeMetadata(key: string) {
    setNewStage(prev => {
      const { [key]: removed, ...rest } = prev.metadata
      return { ...prev, metadata: rest }
    })
  }

  async function handleAddStage() {
    try {
      const stageId = `stage-${Date.now()}`
      
      let stageData: Stage = {
        id: stageId,
        title: newStage.title,
        imageUrl: newStage.imageUrl,
        metadata: newStage.metadata,
        requiresPayment: newStage.requiresPayment
      }

      // Add rent configuration if payment is required
      if (newStage.requiresPayment) {
        const rentableStage = await rentService.createRentableStage(
          {
            title: newStage.title,
            metadata: newStage.metadata
          },
          newStage.rentAmount,
          newStage.duration
        )
        
        stageData = { ...stageData, ...rentableStage }
      }

      setStages(prev => [...prev, stageData])
      
      // Reset form
      setNewStage({
        title: '',
        imageUrl: '',
        metadata: {},
        requiresPayment: false,
        rentAmount: 0,
        duration: 30
      })
      setShowStageForm(false)
    } catch (error) {
      console.error('Failed to add stage:', error)
      alert('Failed to add stage: ' + getErrorMessage(error))
    }
  }

  async function handleFinalizeChain() {
    if (stages.length < 2) {
      alert('Action chain must have at least 2 stages')
      return
    }

    if (!chainTitle) {
      alert('Please enter a title for the action chain')
      return
    }

    try {
      const response = await fetch('/api/chains/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: chainTitle,
          stages,
          ownerKey
        })
      })

      const data = await response.json()
      
      setChainId(data.chainId)
      setFinalized(true)
      
      alert('Action chain finalized successfully!')
    } catch (error) {
      console.error('Failed to finalize chain:', error)
      alert('Failed to finalize chain: ' + getErrorMessage(error))
    }
  }

  async function handlePaymentComplete(stageId: string, txid: string) {
    try {
      // Update stage with payment info
      setStages(prev => prev.map(stage => 
        stage.id === stageId
          ? {
              ...stage,
              payment: {
                txid,
                amount: stage.rentAmount,
                status: 'pending',
                timestamp: new Date()
              }
            }
          : stage
      ))

      // Update in database
      await fetch('/api/chains/update-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chainId,
          stageId,
          paymentData: {
            txid,
            amount: stages.find(s => s.id === stageId)?.rentAmount,
            status: 'pending'
          }
        })
      })
    } catch (error) {
      console.error('Failed to update payment:', error)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Supply Chain Action Builder
        </h1>
        <p className="text-lg text-gray-600">
          Create your own blockchain action chains
        </p>
      </div>

      {/* Chain Title Input */}
      {!finalized && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Action Chain Title
          </label>
          <input
            type="text"
            value={chainTitle}
            onChange={(e) => setChainTitle(e.target.value)}
            placeholder="e.g., Plastic Product Lifecycle"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Finalized Chain Info */}
      {finalized && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{chainTitle}</h2>
              <p className="text-sm text-gray-600 font-mono">Chain ID: {chainId}</p>
            </div>
            <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
              ✓ Finalized
            </div>
          </div>
        </div>
      )}

      {/* Stages Display */}
      {stages.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Stages ({stages.length}/8)
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {stages.map((stage, index) => (
              <StageCard
                key={stage.id}
                stage={stage}
                chainId={chainId}
                stageIndex={index}
                onPaymentComplete={handlePaymentComplete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add Stage Section */}
      {!finalized && (
        <div className="space-y-4">
          {!showStageForm ? (
            <button
              onClick={() => setShowStageForm(true)}
              className="w-full px-6 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-primary-600"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-lg font-medium">Add Stage</span>
            </button>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">Create New Stage</h3>

              {/* Stage Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stage Title *
                </label>
                <input
                  type="text"
                  value={newStage.title}
                  onChange={(e) => setNewStage(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Raw Material Extraction"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL (optional)
                </label>
                <input
                  type="url"
                  value={newStage.imageUrl}
                  onChange={(e) => setNewStage(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Metadata */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Metadata
                </label>
                
                {Object.entries(newStage.metadata).length > 0 && (
                  <div className="space-y-2">
                    {Object.entries(newStage.metadata).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <span className="font-medium text-sm">{key}:</span>
                        <span className="text-sm flex-1">{value}</span>
                        <button
                          onClick={() => removeMetadata(key)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={metadataKey}
                    onChange={(e) => setMetadataKey(e.target.value)}
                    placeholder="Key"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={metadataValue}
                    onChange={(e) => setMetadataValue(e.target.value)}
                    placeholder="Value"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <button
                    onClick={addMetadata}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Rent Configuration */}
              <div className="border-t border-gray-200 pt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="requiresPayment"
                    checked={newStage.requiresPayment}
                    onChange={(e) => setNewStage(prev => ({ 
                      ...prev, 
                      requiresPayment: e.target.checked 
                    }))}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="requiresPayment" className="text-sm font-medium text-gray-700">
                    Require rent payment for this stage
                  </label>
                </div>

                {newStage.requiresPayment && (
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rent Amount (MNEE)
                      </label>
                      <input
                        type="number"
                        value={newStage.rentAmount}
                        onChange={(e) => setNewStage(prev => ({ 
                          ...prev, 
                          rentAmount: parseInt(e.target.value) || 0 
                        }))}
                        min="1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (days)
                      </label>
                      <input
                        type="number"
                        value={newStage.duration}
                        onChange={(e) => setNewStage(prev => ({ 
                          ...prev, 
                          duration: parseInt(e.target.value) || 30 
                        }))}
                        min="1"
                        max="365"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddStage}
                  disabled={!newStage.title}
                  className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
                >
                  Add Stage
                </button>
                <button
                  onClick={() => setShowStageForm(false)}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Finalize Button */}
      {!finalized && stages.length >= 2 && (
        <button
          onClick={handleFinalizeChain}
          className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-lg transition-colors"
        >
          Finalize Action Chain ({stages.length} stages)
        </button>
      )}
    </div>
  )
}
