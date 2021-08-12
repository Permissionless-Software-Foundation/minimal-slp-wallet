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

    // Allow the wallet service adapter to be overwritten at runtime.
    if (localConfig.jsonRpcWalletService) {
      this.jsonRpcWalletService = localConfig.jsonRpcWalletService
    } else {
      // Use the default placeholder if service adapter is to specified.
      this.jsonRpcWalletService = new WalletService()
    }
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

        return utxos
      } else if (this.interface === 'json-rpc') {
        const utxos = await this.jsonRpcWalletService.getUtxos(addr)

        return utxos
      }

      throw new Error('this.interface is not specified')
    } catch (err) {
      console.error('Error in router.js/getUtxos()')
      throw err
    }
  }

  // Attempts to broadcast a transaction to the network. hex is expected to be
  // a string containing a hexidecimal recresentation of the transaction.
  async sendTx (hex) {
    try {
      if (!hex) {
        throw new Error('Hex encoded transaction required as input.')
      }

      if (this.interface === 'rest-api') {
        const txid = await this.bchjs.RawTransactions.sendRawTransaction(hex)
        // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

        return txid
      } else if (this.interface === 'json-rpc') {
        const txid = await this.jsonRpcWalletService.sendTx(hex)

        return txid
      }

      throw new Error('this.interface is not specified')
    } catch (err) {
      console.error('Error in router.js/sendTx()')
      throw err
    }
  }
}

module.exports = AdapterRouter
