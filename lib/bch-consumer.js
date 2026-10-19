/*
  Client for the free-bch.fullstack.cash consumer API.

  Replaces the bch-consumer package, which depended on axios 0.25, apidoc 0.51,
  and an older @psf/bch-js. Those production dependencies were inherited by
  every project that installed this wallet.
*/

import axios from 'axios'

const DEFAULT_REST_URL = 'https://free-bch.fullstack.cash'

class BchApi {
  constructor ({ restURL, axios: http }) {
    this.restURL = restURL
    this.axios = http

    this.getBalance = this.getBalance.bind(this)
    this.getUtxos = this.getUtxos.bind(this)
    this.getTxHistory = this.getTxHistory.bind(this)
    this.sendTx = this.sendTx.bind(this)
    this.getTxData = this.getTxData.bind(this)
    this.getUsd = this.getUsd.bind(this)
    this.utxoIsValid = this.utxoIsValid.bind(this)
    this.getTokenData = this.getTokenData.bind(this)
    this.getTokenData2 = this.getTokenData2.bind(this)
    this.getPsffppWritePrice = this.getPsffppWritePrice.bind(this)
    this.cid2json = this.cid2json.bind(this)
  }

  async getBalance (addr) {
    let body = { addresses: [] }
    if (typeof addr === 'string') {
      body = { addresses: [addr] }
    } else if (Array.isArray(addr)) {
      body = { addresses: addr }
    } else {
      throw new Error('Input must be a string (address) or an array of strings')
    }

    const result = await this.axios.post(`${this.restURL}/bch/balance`, body)
    return result.data
  }

  async getUtxos (addr) {
    if (typeof addr === 'string') {
      const result = await this.axios.post(`${this.restURL}/bch/utxos`, {
        address: addr
      })
      return result.data
    }

    if (!Array.isArray(addr)) {
      throw new Error('addr parameter must be an array or a string')
    }
    if (addr.length > 20) {
      throw new Error('addr parameter must not exceed 20 elements')
    }

    const result = await this.axios.post(`${this.restURL}/bch/utxosBulk`, {
      addresses: addr
    })
    return result.data
  }

  async getTxHistory (addr, sortOrder) {
    if (typeof addr !== 'string') {
      throw new Error('Input must be a string containing bitcoincash address')
    }

    const result = await this.axios.post(`${this.restURL}/bch/txHistory`, {
      address: addr,
      sortOrder
    })
    return result.data
  }

  async sendTx (hex) {
    if (typeof hex !== 'string') {
      throw new Error(
        'Input must be a string containing hex representation of a transaction'
      )
    }

    const result = await this.axios.post(`${this.restURL}/bch/broadcast`, { hex })
    return result.data
  }

  async getTxData (txids) {
    if (!Array.isArray(txids)) {
      throw new Error('Input must be an array of strings representing TXIDs')
    }

    const result = await this.axios.post(`${this.restURL}/bch/txData`, { txids })
    return result.data.txData
  }

  async getUsd () {
    const result = await this.axios.get(`${this.restURL}/price/usd`)
    return result.data.usd
  }

  async utxoIsValid (utxo) {
    const result = await this.axios.post(`${this.restURL}/bch/utxoIsValid`, { utxo })
    return result.data
  }

  async getTokenData (tokenId, withTxHistory = false) {
    const result = await this.axios.post(`${this.restURL}/bch/getTokenData`, {
      tokenId,
      withTxHistory
    })
    return result.data
  }

  async getTokenData2 (tokenId, updateCache = false) {
    const result = await this.axios.post(`${this.restURL}/bch/getTokenData2`, {
      tokenId,
      updateCache
    })
    return result.data
  }

  async getPsffppWritePrice () {
    const result = await this.axios.get(`${this.restURL}/price/psffpp`)
    return result.data.psfPrice
  }

  async cid2json (inObj = {}) {
    const { cid } = inObj
    if (!cid) {
      throw new Error('cid is required')
    }

    const result = await this.axios.get(`${this.restURL}/ipfs/cid2json/${cid}`)
    return result.data
  }
}

class MessageApi {
  constructor ({ restURL, axios: http }) {
    this.restURL = restURL
    this.axios = http
    this.getPubKey = this.getPubKey.bind(this)
  }

  async getPubKey (addr) {
    if (typeof addr !== 'string') {
      throw new Error('Input must be a string containing bitcoincash address')
    }

    const result = await this.axios.post(`${this.restURL}/bch/pubkey`, {
      address: addr
    })
    return result.data
  }
}

class BchConsumer {
  constructor (localConfig = {}) {
    this.restURL = localConfig.restURL || DEFAULT_REST_URL
    const http = localConfig.axios || axios

    this.bch = new BchApi({ restURL: this.restURL, axios: http })
    this.msg = new MessageApi({ restURL: this.restURL, axios: http })
  }
}

export default BchConsumer
