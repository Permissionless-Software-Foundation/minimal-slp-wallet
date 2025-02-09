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

    // Bind 'this' object to all methods
    this.getBalance = this.getBalance.bind(this)
    this.getUtxos = this.getUtxos.bind(this)
    this.getTransactions = this.getTransactions.bind(this)
    this.getTxData = this.getTxData.bind(this)
    this.sendTx = this.sendTx.bind(this)
    this.getUsd = this.getUsd.bind(this)
    this.utxoIsValid = this.utxoIsValid.bind(this)
    this.getTokenData = this.getTokenData.bind(this)
    this.getTokenData2 = this.getTokenData2.bind(this)
    this.getPubKey = this.getPubKey.bind(this)
    this.getPsfWritePrice = this.getPsfWritePrice.bind(this)
    this.cid2json = this.cid2json.bind(this)
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
        // console.log('result: ', result)

        // Handle failure from communicating with wallet service.
        if (!result.success) {
          throw new Error(result.message)
        }

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
  async getTransactions (addr, sortingOrder = 'DESCENDING') {
    try {
      if (!addr) {
        throw new Error(
          'Address string required when calling getTransactions()'
        )
      }

      if (this.interface === 'rest-api') {
        const data = await this.bchjs.Electrumx.transactions(addr)
        // console.log('getTransactions() rest-api: ', data)

        const sortedTxs = await this.bchjs.Electrumx.sortAllTxs(data.transactions, sortingOrder)
        data.transactions = sortedTxs

        return data

        //
      } else if (this.interface === 'consumer-api') {
        const result = await this.bchConsumer.bch.getTxHistory(addr, sortingOrder)
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
        let txid = await this.bchjs.RawTransactions.sendRawTransaction([hex])
        // console.log('txid: ', txid)

        // bch-js returns an array. Refactor this to return a string.
        txid = txid[0]

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
  async getTokenData (tokenId, withTxHistory = false, sortOrder = 'DESCENDING') {
    try {
      if (!tokenId) {
        throw new Error('tokenId required as input.')
      }

      let tokenData

      if (this.interface === 'rest-api') {
        tokenData = await this.bchjs.PsfSlpIndexer.getTokenData(tokenId, withTxHistory)
        // return tokenData
      } else if (this.interface === 'consumer-api') {
        tokenData = await this.bchConsumer.bch.getTokenData(tokenId, withTxHistory)
        // console.log('tokenData: ', JSON.stringify(tokenData, null, 2))

        // Handle failure from communicating with wallet service.
        if (!tokenData.success) {
          throw new Error(tokenData.message)
        }

        tokenData = tokenData.tokenData
      }

      // If the token history is requested, then sort the transactions.
      // TODO: the Electrumx.sortAllTxs() makes a call to get the block height,
      // which could be problematic. It would be best to pull that function out
      // of the bch-js library and create a utility function in this library.
      if (withTxHistory) {
        if (!tokenData.genesisData.txs) {
          throw new Error('No transaction history included with genesis data.')
        }

        // 4/6/23 CT - commented out this sorting function because it depends on
        // a network call to bch-api, which is not available when this function
        // is called with the consumer-api interface. I believe this sorting
        // is redundent anyways. It was put here as a temporary fix until the
        // sorting was added to bch-api, which it has been.
        // const sortedTxs = await this.bchjs.Electrumx.sortAllTxs(tokenData.genesisData.txs, sortOrder)
        // tokenData.genesisData.txs = sortedTxs
      }

      return tokenData

      // throw new Error('this.interface is not specified')
    } catch (err) {
      console.error('Error in minimal-slp-wallet/getTokenData()')

      throw err
    }
  }

  // Get token icon and other media
  async getTokenData2 (tokenId, updateCache = false) {
    try {
      if (!tokenId) {
        throw new Error('tokenId required as input.')
      }

      if (this.interface === 'rest-api') {
        const tokenData = await this.bchjs.PsfSlpIndexer.getTokenData2(tokenId, updateCache)
        return tokenData
      } else if (this.interface === 'consumer-api') {
        const tokenData = await this.bchConsumer.bch.getTokenData2(tokenId, updateCache)
        return tokenData.tokenData
      }

      throw new Error('this.interface is not specified')
    } catch (err) {
      console.error('Error in minimal-slp-wallet/getTokenData2()')

      throw err
    }
  }

  // Get a public key for a given address. This can be used to send encrypted
  // messages to the address.
  async getPubKey (addr) {
    try {
      if (!addr) {
        throw new Error('addr required as input.')
      }

      if (this.interface === 'rest-api') {
        let pubKey
        try {
          pubKey = await this.bchjs.encryption.getPubKey(addr)
          // console.log('pubKey: ', pubKey)
        } catch (err) {
          // console.log('err: ', err)
          throw new Error(err.error)
        }

        // console.log('pubKey: ', pubKey)

        return pubKey.publicKey
      } else if (this.interface === 'consumer-api') {
        const result = await this.bchConsumer.msg.getPubKey(addr)
        // console.log('result: ', result)

        if (!result.success) {
          throw new Error(result.message)
        }

        return result.pubkey.publicKey
      }

      throw new Error('this.interface is not specified')
    } catch (err) {
      console.error('Error in minimal-slp-wallet/router.js/getPubKey()')

      throw err
    }
  }

  // Retrieve the current price in PSF tokens to write 1MB of data to the
  // PSFFPP (psffpp.com) IPFS pinning network.
  async getPsfWritePrice () {
    try {
      let price

      if (this.interface === 'rest-api') {
        try {
          price = await this.bchjs.Price.getPsffppPrice()
          console.log('price: ', price)
        } catch (err) {
          console.log('err: ', err)
          throw new Error(err.error)
        }

        return price
      } else if (this.interface === 'consumer-api') {
        price = await this.bchConsumer.bch.getPsffppWritePrice()
        // console.log('result: ', result)

        return price
      }

      throw new Error('this.interface is not specified')
    } catch (err) {
      console.error('Error in minimal-slp-wallet/router.js/getPsfWritePrice()')

      throw err
    }
  }

  // Convert a CID to a JSON object.
  async cid2json (inObj = {}) {
    try {
      const { cid } = inObj
      console.log('router.js/cid2json() cid: ', cid)

      if (!cid) {
        throw new Error('cid required as input.')
      }

      if (this.interface === 'rest-api') {
        throw new Error('cid2json() is not supported with the rest-api interface.')
      } else if (this.interface === 'consumer-api') {
        const result = await this.bchConsumer.bch.cid2json({ cid })
        return result
      }

      throw new Error('this.interface is not specified')
    } catch (err) {
      console.error('Error in minimal-slp-wallet/router.js/cid2json(): ', err)
      throw err
    }
  }
}

module.exports = AdapterRouter
