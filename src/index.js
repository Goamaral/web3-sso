const crypto = require('crypto')
const ethers = require('ethers')

const MAX_NUMBER = 281474976710655

// REVIEW: Search better ways to generate a challenge
const defaultGenerateChallenge = () => {
  return crypto.createHash('sha256')
    .update((crypto.randomInt(MAX_NUMBER) * new Date()).toString(10))
    .digest('hex')
}

module.exports = class {
  constructor (opts = {}) {
    // Set defaults and validate input
    if (!opts.store) opts.store = new Map()
    if (!opts.store.get) throw new Error('Store must implement a get method')
    if (!opts.store.set) throw new Error('Store must implement a set method')
    if (!opts.store.delete) throw new Error('Store must implement a delete method')

    if (!opts.generateChallenge) opts.generateChallenge = defaultGenerateChallenge
    if (!opts.challengeMessage) opts.challengeMessage = 'Login request\n'

    // Set properties
    this.store = opts.store
    this.generateChallenge = opts.generateChallenge
    this.challengeMessage = opts.challengeMessage
  }

  // Issue challenge
  async issueChallenge (walletAddress) {
    const challenge = `${this.challengeMessage}${this.generateChallenge()}`

    await this.store.set(walletAddress, challenge)
    return challenge
  }

  // Validate signed challenge
  async validateSignedChallenge (walletAddress, signedChallenge) {
    // Get challenge from store
    const challenge = await this.store.get(walletAddress)
    if (challenge === null) return false

    // Get signer address from signed challenge
    const signerAddress = ethers.utils.verifyMessage(challenge, signedChallenge)

    // Check if signer address matches wallet address
    if (signerAddress === walletAddress) {
      await this.store.delete(walletAddress)
      return true
    } else {
      return false
    }
  }
}
