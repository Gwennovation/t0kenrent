export function getBSVNetwork(): string {
  const envValue =
    (typeof process !== 'undefined' &&
      (process.env.NEXT_PUBLIC_BSV_NETWORK || process.env.BSV_NETWORK)) ||
    'test'

  return envValue.toLowerCase()
}

export function isTestnetNetwork(network = getBSVNetwork()): boolean {
  return network === 'test' || network.startsWith('test')
}

export function getWhatsonchainApiBase(network = getBSVNetwork()): string {
  return isTestnetNetwork(network)
    ? 'https://api.whatsonchain.com/v1/bsv/test'
    : 'https://api.whatsonchain.com/v1/bsv/main'
}

export function getWhatsonchainExplorerBase(network = getBSVNetwork()): string {
  return isTestnetNetwork(network)
    ? 'https://test.whatsonchain.com'
    : 'https://whatsonchain.com'
}

export function getDefaultFeePerKb(): number {
  const value =
    (typeof process !== 'undefined' && process.env.BSV_FEE_PER_KB) || undefined
  return value ? Number(value) : 500
}

export function getMinInputSats(): number {
  const value =
    (typeof process !== 'undefined' && process.env.BSV_MIN_INPUT_SATS) || undefined
  return value ? Number(value) : 2000
}
