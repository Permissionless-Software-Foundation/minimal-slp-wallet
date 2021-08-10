/*
  This file routes the network calls to the appropriate adapter, based on
  how this library is instantiated. This allows the code for wallet functions
  to be the same, while building different network adapters that are drop-in
  replacements for one another.
*/

const WalletService = require('./json-rpc-wallet-service.js')

class AdapterRouter {
  constructor (localConfig = {}) {
    // Select the interface to use for network calls.
    this.interface = 'rest-api' // default
    if (localConfig.interface === 'json-rpc') this.interface = 'json-rpc'

    // Dependency injection.
    this.bchjs = localConfig.bchjs
    if (!this.bchjs) {
      throw new Error(
        'Must pass instance of bch-js when instantiating AdapterRouter.'
      )
    }

    // Encapsulate dependencies
    this.jsonRpcWalletService = new WalletService()
  }

  // Get UTXOs from the network service.
  async getUtxos (addr) {
    try {
      if (!addr) {
        throw new Error('Address string required when calling getUtxos()')
      }

      if (this.interface === 'rest-api') {
        const utxos = await this.bchjs.Utxo.get(addr)
        // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

        return utxos[0]
      } else if (this.interface === 'json-rpc') {
        const utxos = await this.jsonRpcWalletService.getUtxos()

        return utxos
      }

      throw new Error('this.interface is not specified')
    } catch (err) {
      console.error('Error in router.js/getUtxos()')
      throw err
    }
  }
}

module.exports = AdapterRouter
