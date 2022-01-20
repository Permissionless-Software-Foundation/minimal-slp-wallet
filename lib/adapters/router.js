/*
  This file routes the network calls to the appropriate adapter, based on
  how this library is instantiated. This allows the code for wallet functions
  to be the same, while building different network adapters that are drop-in
  replacements for one another.

  If this.interface === 'rest-api', then use bch-js api.FullStack.cash
  if this.interface === 'consumer-api', then use bch-consumer and free-bch.fullstack.cash.
*/

const BchConsumer = require('bch-consumer')

class AdapterRouter {
  constructor (localConfig = {}) {
    // Dependency injection.
    this.bchjs = localConfig.bchjs
    if (!this.bchjs) {
      throw new Error(
        'Must pass instance of bch-js when instantiating AdapterRouter.'
      )
    }

    // Select the interface to use for network calls.
    this.interface = 'rest-api' // default
    if (localConfig.interface === 'consumer-api') {
      this.interface = 'consumer-api'
      if (localConfig.restURL) {
        this.bchConsumer = new BchConsumer({ restURL: localConfig.restURL })
      } else {
        this.bchConsumer = new BchConsumer()
      }
    }

    // Allow the wallet service adapter to be overwritten at runtime.
    // if (localConfig.walletService) {
    //   this.walletService = localConfig.walletService
    // } else {
    //   // Use the default placeholder if service adapter is to specified.
    //   this.walletService = new WalletConsumer(localConfig)
    // }
  }

  async getBalance (addr) {
    try {
      if (!addr) {
        throw new Error('Address string required when calling getBalance()')
      }

      if (this.interface === 'rest-api') {
        const balances = await this.bchjs.Electrumx.balance(addr)
        return balances

        //
      } else if (this.interface === 'consumer-api') {
        const result = await this.bchConsumer.bch.getBalance(addr)

        // Construct an object that matches the bchjs output.
        const balances = {
          success: result.success,
          balance: result.balances[0].balance
        }

        return balances
      }

      throw new Error('this.interface is not specified')
    } catch (err) {
      console.error('Error in router.js/getBalance()')
      throw err
    }
  }

  // Get UTXOs from the network service.
  async getUtxos (addr) {
    try {
      if (!addr) {
        throw new Error('Address string required when calling getUtxos()')
      }

      // console.log(`getUtxos() this.interface: ${this.interface}`)
      if (this.interface === 'rest-api') {
        const utxos = await this.bchjs.Utxo.get(addr)
        // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

        return utxos
      } else if (this.interface === 'consumer-api') {
        const utxos = await this.bchConsumer.bch.getUtxos(addr)
        // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

        return utxos
      }

      throw new Error('this.interface is not specified')
    } catch (err) {
      console.error('Error in router.js/getUtxos()')
      throw err
    }
  }

  async getTransactions (addr) {
    try {
      if (!addr) {
        throw new Error(
          'Address string required when calling getTransactions()'
        )
      }

      if (this.interface === 'rest-api') {
        const data = await this.bchjs.Electrumx.transactions(addr)
        return data

        //
      } else if (this.interface === 'consumer-api') {
        const result = await this.bchConsumer.bch.getTransactions(addr)

        // Construct an object that matches the bchjs output.
        const txs = {
          success: result.success,
          transactions: result.transactions[0].transactions
        }

        return txs
      }

      throw new Error('this.interface is not specified')
    } catch (err) {
      console.error('Error in router.js/getBalance()')
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
      } else if (this.interface === 'consumer-api') {
        const txid = await this.bchConsumer.bch.sendTx(hex)
        // console.log('sendTx() txid: ', txid)

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
