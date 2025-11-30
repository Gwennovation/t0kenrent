import { createAction, getPublicKey } from 'babbage-sdk'
import { Script, Transaction, P2PKH } from '@bsv/sdk'

export interface MNEEPayment {
  recipientKey: string
  amount: number
  description: string
}

export interface MNEEOutput {
  satoshis: number
  script: string
  amount: number
}

/**
 * Create a MNEE payment transaction
 */
export async function createMNEEPayment(
  payment: MNEEPayment
): Promise<{ txid: string; rawTx: string }> {
  try {
    // Create locking script for MNEE token
    const lockingScript = await createMNEEScript(
      payment.recipientKey,
      payment.amount
    )

    // Create the transaction using Babbage SDK
    const result = await createAction({
      description: payment.description,
      outputs: [
        {
          satoshis: 1, // MNEE tokens use 1 satoshi UTXOs
          script: lockingScript,
          basket: 'MNEE tokens'
        }
      ]
    })

    return {
      txid: result.txid,
      rawTx: result.rawTx
    }
  } catch (error) {
    console.error('MNEE payment creation failed:', error)
    throw new Error(`Failed to create MNEE payment: ${error.message}`)
  }
}

/**
 * Create MNEE locking script
 * Format: P2PKH + OP_RETURN with MNEE metadata
 */
async function createMNEEScript(
  recipientKey: string,
  amount: number
): Promise<string> {
  // Convert public key to address hash
  const p2pkh = new P2PKH()
  const addressHash = p2pkh.createLockingScript(recipientKey)

  // Create MNEE metadata
  const mneeData = encodeMNEEAmount(amount)

  // Combine P2PKH with OP_RETURN metadata
  const script = Script.fromASM(`
    ${addressHash.toASM()}
    OP_RETURN
    ${Buffer.from('MNEE').toString('hex')}
    ${mneeData}
  `)

  return script.toHex()
}

/**
 * Encode MNEE amount as hex
 */
function encodeMNEEAmount(amount: number): string {
  const buffer = Buffer.allocUnsafe(8)
  buffer.writeBigUInt64LE(BigInt(amount))
  return buffer.toString('hex')
}

/**
 * Decode MNEE amount from script
 */
export function decodeMNEEAmount(script: string): number {
  try {
    const scriptObj = Script.fromHex(script)
    const chunks = scriptObj.chunks

    // Find OP_RETURN and extract amount
    for (let i = 0; i < chunks.length; i++) {
      if (chunks[i].op === 106) { // OP_RETURN
        // Next chunks contain MNEE data
        if (chunks[i + 2]) {
          const amountHex = chunks[i + 2].data?.toString('hex')
          if (amountHex) {
            const buffer = Buffer.from(amountHex, 'hex')
            return Number(buffer.readBigUInt64LE())
          }
        }
      }
    }

    throw new Error('MNEE amount not found in script')
  } catch (error) {
    console.error('Failed to decode MNEE amount:', error)
    return 0
  }
}

/**
 * Verify MNEE payment transaction
 */
export async function verifyMNEEPayment(
  txid: string,
  expectedAmount: number,
  recipientKey: string
): Promise<boolean> {
  try {
    // Fetch transaction from overlay
    const tx = await fetchTransaction(txid)

    if (!tx) {
      return false
    }

    // Parse transaction outputs
    const outputs = Transaction.fromHex(tx.rawTx).outputs

    // Find MNEE output
    for (const output of outputs) {
      const amount = decodeMNEEAmount(output.lockingScript.toHex())
      
      if (amount === expectedAmount) {
        // Verify recipient
        // TODO: Extract and verify public key from script
        return true
      }
    }

    return false
  } catch (error) {
    console.error('Payment verification failed:', error)
    return false
  }
}

/**
 * Get MNEE balance for a user
 */
export async function getMNEEBalance(userKey: string): Promise<number> {
  try {
    // Query overlay for user's MNEE UTXOs
    const response = await fetch(`${process.env.OVERLAY_URL}/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: 'ls_mnee',
        query: { owner: userKey, spent: false }
      })
    })

    const data = await response.json()
    
    // Sum up all unspent MNEE tokens
    let balance = 0
    for (const utxo of data.outputs || []) {
      balance += decodeMNEEAmount(utxo.script)
    }

    return balance
  } catch (error) {
    console.error('Failed to fetch MNEE balance:', error)
    return 0
  }
}

/**
 * Helper to fetch transaction from overlay
 */
async function fetchTransaction(txid: string): Promise<any> {
  try {
    const response = await fetch(
      `${process.env.OVERLAY_URL}/transaction/${txid}`
    )
    
    if (!response.ok) {
      throw new Error(`Transaction not found: ${txid}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to fetch transaction:', error)
    return null
  }
}

/**
 * Send payment notification via MessageBox
 */
export async function sendPaymentNotification(
  recipientKey: string,
  paymentData: {
    txid: string
    amount: number
    description: string
  }
): Promise<void> {
  try {
    // Encrypt message for recipient
    const message = JSON.stringify({
      type: 'payment',
      ...paymentData,
      timestamp: Date.now()
    })

    // Create MessageBox transaction
    await createAction({
      description: 'Payment notification',
      outputs: [
        {
          satoshis: 1,
          script: await createMessageBoxScript(recipientKey, message),
          basket: 'messagebox'
        }
      ]
    })
  } catch (error) {
    console.error('Failed to send payment notification:', error)
    // Non-critical, don't throw
  }
}

/**
 * Create MessageBox script for encrypted messaging
 */
async function createMessageBoxScript(
  recipientKey: string,
  message: string
): Promise<string> {
  // Get encryption key for recipient
  const encryptionKey = await getPublicKey({
    protocolID: [1, 'messagebox'],
    keyID: recipientKey,
    counterparty: recipientKey
  })

  // TODO: Implement proper encryption
  // For now, create basic OP_RETURN script
  const script = Script.fromASM(`
    OP_RETURN
    ${Buffer.from('MSGBOX').toString('hex')}
    ${Buffer.from(message).toString('hex')}
  `)

  return script.toHex()
}
