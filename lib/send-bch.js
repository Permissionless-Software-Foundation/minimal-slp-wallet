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
      let utxos = await _this.bchjs.Electrumx.utxo(walletInfo.cashAddress)

      if (!utxos.success) throw new Error('Could not retrieve UTXO data.')

      utxos = utxos.utxos

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
  // Uses the smallest UTXOs first, which maximizes the number UTXOs used.
  // This helps reduce the total number UTXOs in the wallet, which is efficient
  // for limiting the number of network calls.
  getNecessaryUtxosAndChange (outputs, availableUtxos) {
    const sortedUtxos = this.sortUtxosBySize(availableUtxos, 'ASCENDING')
    // console.log(`sortedUtxos: ${JSON.stringify(sortedUtxos, null, 2)}`)

    const satsPerByte = 1.0

    // Calculate the miner fee, assuming inputs (this cost will be added later).
    const fee = _this.calculateFee(0, outputs.length, satsPerByte)

    // Calculate the satoshis needed (minus the fee for each input)
    const satoshisToSend = outputs.reduce(
      (acc, receiver) => acc + receiver.amountSat,
      0
    )
    let satoshisNeeded = satoshisToSend + fee

    let satoshisAvailable = 0
    const necessaryUtxos = []

    // Add each UTXO to the calculation until enough satoshis are found.
    for (const utxo of sortedUtxos) {
      // Add the next UTXO.
      necessaryUtxos.push(utxo)
      satoshisAvailable += utxo.value

      // Additional cost per Utxo input is 148 sats for mining fees.
      satoshisNeeded += 148

      // Exit the loop once enough UTXOs are found to pay the the TX.
      if (satoshisAvailable >= satoshisNeeded) {
        break
      }
    }

    // Calculate the remainder or 'change' to send back to the sender.
    const change = satoshisAvailable - satoshisNeeded

    // If change is less than zero, something went wrong. Sanity check.
    if (change < 0) {
      console.error(
        `Available satoshis (${satoshisAvailable}) below needed satoshis (${satoshisNeeded}).`
      )
      throw new Error('Insufficient balance')
    }

    return { necessaryUtxos, change }
  }

  // Sort the UTXOs by the size of satoshis they hold.
  sortUtxosBySize (utxos, sortingOrder = 'ASCENDING') {
    if (sortingOrder === 'ASCENDING') {
      return utxos.sort((a, b) => a.value - b.value)
    } else {
      return utxos.sort((a, b) => b.value - a.value)
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
