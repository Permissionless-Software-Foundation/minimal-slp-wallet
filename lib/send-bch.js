/*
  This library contains functions specific to sending BCH.
*/

let _this

const BCHJS = require('@psf/bch-js')
const bchDonation = require('bch-donation')

// Send the Permissionless Software Foundation a donation to thank them for creating
// and maintaining this software.
const PSF_DONATION = 2000

class SendBCH {
  constructor () {
    this.bchjs = new BCHJS()

    // This should be the last command in the constructor.
    // _this is a local global variable for when 'this' loses scope.
    _this = this
  }

  // Top-level function that orchestrates the sending of BCH.
  // Expects an array of BCH-only UTXOs. Does not check if UTXOs belong to a token,
  // and will burn tokens if they are included in the UTXO list.
  async sendBch (outputs, walletInfo, utxos) {
    try {
      // Generate the transaction.
      const transaction = await this.createTransaction(
        outputs,
        walletInfo,
        utxos
      )
      // console.log('transaction hex: ', transaction.hex)

      // Broadcast the transaction to the network.
      const txid = await _this.bchjs.RawTransactions.sendRawTransaction(
        transaction.hex
      )
      // console.log(txid)

      // TODO: Remove the spent UTXOs from the utxoStore.

      return txid
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
  // Expects an array of BCH-only UTXOs. Does not check if UTXOs belong to a token,
  // and will burn tokens if they are included in the UTXO list.
  async createTransaction (outputs, walletInfo, utxos) {
    try {
      // If the BCH utxos array is still empty, then throw an error.
      if (!utxos || utxos.length === 0) {
        throw new Error('UTXO list is empty')
      }

      // Determine the UTXOs needed to be spent for this TX, and the change
      // that will be returned to the wallet.
      const { necessaryUtxos, change } = _this.getNecessaryUtxosAndChange(
        outputs,
        utxos
      )

      // Create an instance of the Transaction Builder.
      const transactionBuilder = new _this.bchjs.TransactionBuilder()

      // Add inputs
      necessaryUtxos.forEach(utxo => {
        transactionBuilder.addInput(utxo.tx_hash, utxo.tx_pos)
      })

      // Add outputs
      outputs.forEach(receiver => {
        transactionBuilder.addOutput(receiver.address, receiver.amountSat)
      })

      // Send a 2000 sat donation to PSF to thank them for creating this awesome software.
      // console.log(`psf: ${bchDonation('psf').donations}`)
      transactionBuilder.addOutput(bchDonation('psf').donations, PSF_DONATION)

      // Send change back to the wallet, if it's bigger than dust.
      console.log(`change: ${change}`)
      if (change && change > 546) {
        transactionBuilder.addOutput(walletInfo.cashAddress, change)
      }

      // Generate a key pair from the mnemonic.
      const keyPair = await _this.getKeyPairFromMnemonic(walletInfo)

      // Sign each UTXO that is about to be spent.
      necessaryUtxos.forEach((utxo, i) => {
        let redeemScript

        transactionBuilder.sign(
          i,
          keyPair,
          redeemScript,
          transactionBuilder.hashTypes.SIGHASH_ALL,
          utxo.value
        )
      })

      // Build the transaction, return the compiled transaction in hex format.
      const tx = transactionBuilder.build()
      return { hex: tx.toHex(), txid: tx.getId() }
    } catch (err) {
      console.error('Error in send-bch.js/createTransaction()')
      throw err
    }
  }

  // Get the UTXOs required to generate a transaction.
  // Uses the smallest UTXOs first, which maximizes the number UTXOs used.
  // This helps reduce the total number UTXOs in the wallet, which is efficient
  // for limiting the number of network calls.
  getNecessaryUtxosAndChange (outputs, availableUtxos, satsPerByte = 1.0) {
    const sortedUtxos = this.sortUtxosBySize(availableUtxos, 'ASCENDING')
    // console.log(`sortedUtxos: ${JSON.stringify(sortedUtxos, null, 2)}`)

    // const satsPerByte = 1.0

    // Calculate the miner fee, assuming inputs (this cost will be added later).
    // Change is assumed, that the +1.
    const fee = _this.calculateFee(0, outputs.length + 1, satsPerByte)
    console.log(`fee: ${fee}`)

    // Calculate the satoshis needed (minus the fee for each input)
    const satoshisToSend = outputs.reduce(
      (acc, receiver) => acc + receiver.amountSat,
      0
    )
    let satoshisNeeded = satoshisToSend + fee + PSF_DONATION

    let satoshisAvailable = 0
    const necessaryUtxos = []

    // Add each UTXO to the calculation until enough satoshis are found.
    for (const utxo of sortedUtxos) {
      // TODO: Check getTxOut() on the full node to verify the UTXO is valid.

      // TODO: Check the ancestor history to make sure the UTXO won't fail the
      // 50-chain limit rule.

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
    // console.log(`change: ${change}`)

    // If change is less than zero, something went wrong. Sanity check.
    if (change < 0) {
      console.error(
        `Available satoshis (${satoshisAvailable}) below needed satoshis (${satoshisNeeded}).`
      )
      throw new Error('Insufficient balance')
    }

    // console.log(`necessaryUtxos: ${JSON.stringify(necessaryUtxos, null, 2)}`)
    // console.log(`change: ${JSON.stringify(change, null, 2)}`)

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
      const byteCount = _this.bchjs.BitcoinCash.getByteCount(
        { P2PKH: numInputs },
        { P2PKH: numOutputs + 1 }
      )

      const fee = Math.ceil(byteCount * satsPerByte)

      if (isNaN(fee)) {
        throw new Error('Invalid input. Fee could not be calculated.')
      }

      return fee
    } catch (err) {
      console.error('Error in send-bch.js/calculateFee()')
      throw err
    }
  }

  async getKeyPairFromMnemonic (walletInfo) {
    const rootSeed = await _this.bchjs.Mnemonic.toSeed(walletInfo.mnemonic)
    const masterHDNode = _this.bchjs.HDNode.fromSeed(rootSeed /*, "bchtest" */)
    const change = _this.bchjs.HDNode.derivePath(
      masterHDNode,
      walletInfo.hdPath
    )

    const keyPair = _this.bchjs.HDNode.toKeyPair(change)

    return keyPair
  }
}

module.exports = SendBCH
