/**
 * T0kenRent Overlay Network Module
 * 
 * Exports Topic Manager and Lookup Service for T0kenRent overlay integration.
 * 
 * Team: ChibiTech
 * Project: T0kenRent - BSV Hackathon 2025
 */

// Topic Manager
export {
  TokenRentTopicManager,
  createTopicManager,
  TOPICS,
  PROTOCOL,
  ADMITTANCE_RULES
} from './TopicManager'
export type {
  AdmittanceRules,
  TopicOutput,
  ParsedProtocolData
} from './TopicManager'

// Lookup Service
export {
  TokenRentLookupService,
  createLookupService,
  discoverServices
} from './LookupService'
export type {
  AssetRecord,
  EscrowRecord,
  PaymentRecord
} from './LookupService'

// Re-export AssetFilters from TopicManager
export type { AssetFilters } from './TopicManager'

/**
 * Default overlay URL
 */
export const DEFAULT_OVERLAY_URL = process.env.OVERLAY_URL || 'https://overlay-us-1.bsvb.tech'

/**
 * Initialize overlay services
 */
export function initializeOverlay(overlayUrl?: string) {
  const url = overlayUrl || DEFAULT_OVERLAY_URL
  
  return {
    topicManager: createTopicManager(url),
    lookupService: createLookupService(url)
  }
}
