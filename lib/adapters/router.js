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
    console.log(`Initializing minimal-slp-wallet routers with this interface: ${this.interface}`)

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

        // Handle communication errors.
        if (utxos[0].success === false) throw new Error(utxos[0].message)

        return utxos[0]
      }

      throw new Error('this.interface is not specified')
    } catch (err) {
      console.error('Error in router.js/getUtxos()')
      throw err
    }
  }

  // Get transaction history for an address.
  async getTransactions (addr) {
    try {
      if (!addr) {
        throw new Error(
          'Address string required when calling getTransactions()'
        )
      }

      if (this.interface === 'rest-api') {
        const data = await this.bchjs.Electrumx.transactions(addr)
        // console.log('getTransactions() rest-api: ', data)
        return data

        //
      } else if (this.interface === 'consumer-api') {
        const result = await this.bchConsumer.bch.getTxHistory(addr)
        // console.log(
        //   `getTransactions() bchConsumer: ${JSON.stringify(result, null, 2)}`
        // )

        // Construct an object that matches the bchjs output.
        const txs = {
          success: result.success,
          transactions: result.txs
        }

        return txs
      }

      throw new Error('this.interface is not specified')
    } catch (err) {
      console.error('Error in router.js/getBalance()')
      throw err
    }
  }

  // Get transaction details for an array of TXIDs, up to 20 elements.
  async getTxData (txids) {
    try {
      if (!Array.isArray(txids)) {
        throw new Error('Input txids must be an array of TXIDs. Up to 20.')
      }

      // console.log('minimal getTxData txids: ', txids)
      // console.log('minimal interface: ', this.interface)

      if (this.interface === 'rest-api') {
        const data = []
        for (let i = 0; i < txids.length; i++) {
          const txid = txids[i]
          // console.log('txid: ', txid)

          const txData = await this.bchjs.PsfSlpIndexer.tx(txid)
          data.push(txData.txData)
        }

        return data

        //
      } else if (this.interface === 'consumer-api') {
        const result = await this.bchConsumer.bch.getTxData(txids)

        return result
      }

      throw new Error('this.interface is not specified')
    } catch (err) {
      console.error('Error in router.js/getTxData()')
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
        const txid = await this.bchjs.RawTransactions.sendRawTransaction([hex])
        // console.log('txid: ', txid)

        return txid
      } else if (this.interface === 'consumer-api') {
        const txid = await this.bchConsumer.bch.sendTx(hex)
        // console.log('sendTx() txid: ', txid)

        if (txid.success === false) throw new Error(txid.message)

        return txid.txid
      }

      throw new Error('this.interface is not specified')
    } catch (err) {
      console.error('Error in router.js/sendTx()')

      if (err.error) throw new Error(err.error)
      throw err
    }
  }

  // Get the current price for BCH in USD.
  async getUsd () {
    try {
      if (this.interface === 'rest-api') {
        const price = await this.bchjs.Price.getUsd()
        return price
      } else if (this.interface === 'consumer-api') {
        const price = await this.bchConsumer.bch.getUsd()
        return price
      }

      throw new Error('this.interface is not specified')
    } catch (err) {
      console.error('Error in minimal-slp-wallet/getPrice()')

      throw err
    }
  }

  // Validate that a UTXO is spendable.
  async utxoIsValid (utxo) {
    try {
      if (!utxo) {
        throw new Error('utxo required as input.')
      }

      if (this.interface === 'rest-api') {
        const isValid = await this.bchjs.Utxo.isValid(utxo)
        return isValid
      } else if (this.interface === 'consumer-api') {
        const result = await this.bchConsumer.bch.utxoIsValid(utxo)
        return result.isValid
      }

      throw new Error('this.interface is not specified')
    } catch (err) {
      console.error('Error in minimal-slp-wallet/utxoIsValid()')

      throw err
    }
  }

  // Get mutable and immutable data associated with a token
  async getTokenData (tokenId, withTxHistory = false) {
    try {
      if (!tokenId) {
        throw new Error('tokenId required as input.')
      }

      if (this.interface === 'rest-api') {
        const tokenData = await this.bchjs.PsfSlpIndexer.getTokenData(tokenId, withTxHistory)
        return tokenData
      } else if (this.interface === 'consumer-api') {
        const tokenData = await this.bchConsumer.bch.getTokenData(tokenId, withTxHistory)
        return tokenData.tokenData
      }

      throw new Error('this.interface is not specified')
    } catch (err) {
      console.error('Error in minimal-slp-wallet/tokenId()')

      throw err
    }
  }
}

module.exports = AdapterRouter
