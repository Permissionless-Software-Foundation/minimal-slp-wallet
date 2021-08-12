/*
  This is a wallet-service adapter library for talking to wallet services
  using the JSON-RPC over IPFS.

  The reposiory for wallet services include these ipfs-bch-wallet-service:
  - https://github.com/Permissionless-Software-Foundation/ipfs-bch-wallet-service

  For now, this library will only contain placeholders/mocks. This
  library is being developed in psf-bch-wallet:
  https://github.com/Permissionless-Software-Foundation/psf-bch-wallet
*/

class WalletService {
  async getUtxos (addr) {
    return []
  }
}

module.exports = WalletService
