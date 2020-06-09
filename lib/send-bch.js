/*
  This library contains functions specific to sending BCH.
*/

let _this

const BCHJS = require('@chris.troutner/bch-js')

class SendBCH {
  constructor () {
    _this = this

    _this.bchjs = new BCHJS()
  }

  // Top-level function that orchestrates the sending of BCH.
  async sendBch (outputs, walletInfo) {
    try {
      const transaction = await this.createTransaction(outputs, walletInfo)

      // try {
      //     const sent = await _this.bchjs.RawTransactions.sendRawTransaction(transaction.hex);
      //     console.log(sent);
      // } catch (err) {
      //     console.log(err);
      // }

      return transaction
    } catch (err) {
      console.error('Error in send-bch.js/sendBch()')
      throw err
    }
  }

  // outputs is an array of output objects. Look like this:
  // {
  //     address: "bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h",
  //     // amount in satoshis, 1 satoshi = 0.00000001 Bitcoin
  //     amountSat: 100000
  // }
  async createTransaction (outputs, walletInfo) {
    try {
      // Get UTXOs from the Electrumx indexer.
      const utxos = await _this.bchjs.Electrumx.utxo(walletInfo.cashAddress)

      const { necessaryUtxos, change } = _this.getNecessaryUtxosAndChange(
        outputs,
        utxos
      )

      // const transactionBuilder = new _this.bchjs.TransactionBuilder(/* "bchtest" */)
      //
      // // Add inputs
      // necessaryUtxos.forEach(utxo => {
      //   transactionBuilder.addInput(utxo.txid, utxo.vout)
      // })
      //
      // // Add outputs
      // separatedOutputs.receivers.forEach(receiver => {
      //   transactionBuilder.addOutput(receiver.address, receiver.amountSat)
      // })
      //
      // separatedOutputs.opReturnScripts.forEach(script => {
      //   transactionBuilder.addOutput(script, 0)
      // })
      //
      // if (change && change > 546) {
      //   transactionBuilder.addOutput(walletInfo.cashAddress, change)
      // }
      //
      // // Sign inputs
      // const changeAddr = _this.changeAddrFromMnemonic(
      //   walletInfo.mnemonic,
      //   walletInfo.HdPath
      // )
      // const keyPair = _this.bchjs.HDNode.toKeyPair(changeAddr)
      //
      // necessaryUtxos.forEach((utxo, i) => {
      //   let redeemScript
      //
      //   transactionBuilder.sign(
      //     i,
      //     keyPair,
      //     redeemScript,
      //     transactionBuilder.hashTypes.SIGHASH_ALL,
      //     utxo.satoshis
      //   )
      // })
      //
      // const tx = transactionBuilder.build()
      // return { hex: tx.toHex(), txid: tx.getId() }
    } catch (err) {
      console.error('Error in send-bch.js/createTransaction()')
      throw err
    }
  }

  // Get the UTXOs required to generate a transaction.
  async getNecessaryUtxosAndChange (outputs, availableUtxos) {
    const sortedUtxos = this.sortUtxosBySize(availableUtxos, 'ASCENDING')

    // Calculate he miner fee.
    const fee = _this.calculateFee(0, outputs)

    const satoshisToSend = outputs.receivers.reduce(
      (acc, receiver) => acc + receiver.amountSat,
      0
    )
    let satoshisNeeded = satoshisToSend + fee

    let satoshisAvailable = 0
    const necessaryUtxos = []

    for (const utxo of sortedUtxos) {
      necessaryUtxos.push(utxo)
      satoshisAvailable += utxo.satoshis

      // Additional cost per Utxo input is 148 sats
      satoshisNeeded += 148

      if (satoshisAvailable >= satoshisNeeded) {
        break
      }
    }

    const change = satoshisAvailable - satoshisNeeded

    if (change < 0) {
      console.log(
        `Available satoshis (${satoshisAvailable}) below needed satoshis (${satoshisNeeded}).`
      )
      throw new Error('Insufficient balance')
    }

    return { necessaryUtxos, change }
  }

  // Sort the UTXOs by the size of satoshis they hold.
  sortUtxosBySize (utxos, sortingOrder = 'ASCENDING') {
    if (sortingOrder === 'ASCENDING') {
      return utxos.sort((a, b) => a.satoshis - b.satoshis)
    } else {
      return utxos.sort((a, b) => b.satoshis - a.satoshis)
    }
  }

  // Calculate the miner fee that needs to be paid for this transaction.
  calculateFee (numInputs, numOutputs, satsPerByte) {
    try {
      // const { receivers, opReturnScripts } = separatedOutputs;

      const byteCount = _this.bchjs.BitcoinCash.getByteCount(
        { P2PKH: numInputs },
        { P2PKH: numOutputs }
      )

      return Math.ceil(byteCount * satsPerByte)
    } catch (err) {
      console.error('Error in send-bch.js/calculateFee()')
      throw err
    }
  }

  changeAddrFromMnemonic (mnemonic, hdPath) {
    const rootSeed = _this.bchjs.Mnemonic.toSeed(mnemonic)
    const masterHDNode = _this.bchjs.HDNode.fromSeed(rootSeed /*, "bchtest" */)
    const change = _this.bchjs.HDNode.derivePath(masterHDNode, hdPath)

    return change
  }
}

module.exports = SendBCH
