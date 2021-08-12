/*
  This is a wallet-service adapter library for talking to wallet services
  using the JSON-RPC over IPFS.

  The reposiory for wallet services include these ipfs-bch-wallet-service:
  - https://github.com/Permissionless-Software-Foundation/ipfs-bch-wallet-service

  This library is intended to be overwritten at run-time. This library defines
  the methods that should be implemented in library that is used to overwrite
  this one.
*/

class WalletService {
  // Get UTXOs for an address.
  async getUtxos (addr) {
    return []
  }

  // Broadcast a transaction to the network.
  async sendTx (hex) {
    return ''
  }

  // Get the balance in BCH for an address
  async getBalance (addr) {
    return {}
  }
}

module.exports = WalletService
