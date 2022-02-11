/*
  This library contains utility functions for crafting transactions that
  contain an OP_RETURN output.
*/

const SendBCH = require('./send-bch')

const PSF_DONATION = 2000

class OpReturn {
  constructor (localConfig = {}) {
    // Dependency injection.
    this.bchjs = localConfig.bchjs
    if (!this.bchjs) {
      throw new Error(
        'Must pass instance of bch-js when instantiating OpReturn library.'
      )
    }
    this.ar = localConfig.ar
    if (!this.ar) {
      throw new Error('Must pass instance of Adapter Router.')
    }

    // Encapsulate dependencies.
    // this.bchjs = new BCHJS(localConfig)
    this.sendBch = new SendBCH(localConfig)
    // this.utxos = new Utxos(localConfig)
    // this.ar = new AdapterRouter({ bchjs: this.bchjs })
  }

  // Calculate the miner fee that needs to be paid for this transaction.
  // Takes the size of the OP_RETURN buffer size into account.
  calculateFee (numInputs, numOutputs, satsPerByte, bufSize = 0) {
    try {
      const byteCount = this.bchjs.BitcoinCash.getByteCount(
        { P2PKH: numInputs },
        { P2PKH: numOutputs + 1 }
      )

      let fee = Math.ceil(byteCount * satsPerByte)

      // Adjust for the buffer size of the op_return
      fee = fee + Math.ceil(bufSize * satsPerByte)

      if (isNaN(fee)) {
        throw new Error('Invalid input. Fee could not be calculated.')
      }

      return fee
    } catch (err) {
      console.error('Error in send-bch.js/calculateFee()')
      throw err
    }
  }

  // Get the UTXOs required to generate a transaction.
  // Uses the smallest UTXOs first, which maximizes the number UTXOs used.
  // This helps reduce the total number UTXOs in the wallet, which is efficient
  // for limiting the number of network calls, and leads to better UX.
  getNecessaryUtxosAndChange (outputs, availableUtxos, satsPerByte = 1.0) {
    const sortedUtxos = this.sendBch.sortUtxosBySize(
      availableUtxos,
      'ASCENDING'
    )
    // console.log(`sortedUtxos: ${JSON.stringify(sortedUtxos, null, 2)}`)

    // const satsPerByte = 1.0

    // Calculate the miner fee, assuming inputs (this cost will be added later).
    // Change is assumed, that is the +1.
    const fee = this.calculateFee(0, outputs.length + 1, satsPerByte)
    // console.log(`fee: ${fee}`)

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
}

module.exports = OpReturn
