/*
  This library contains utility functions for crafting transactions that
  contain an OP_RETURN output.
*/

// Public npm libraries
const bchDonation = require('bch-donation')

// Local libraries
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
  calculateFee (numInputs, numOutputs, bufSize = 3, satsPerByte) {
    try {
      const byteCount = this.bchjs.BitcoinCash.getByteCount(
        { P2PKH: numInputs },
        { P2PKH: numOutputs + 1 }
      )

      // console.log(`satsPerByte: ${satsPerByte}`)

      let fee = Math.ceil(byteCount * satsPerByte)
      // console.log(`fee before op_return: ${fee}`)

      // Adjust for the buffer size of the op_return
      const minOpReturnFee = 10
      fee = fee + minOpReturnFee + Math.ceil(bufSize * satsPerByte)
      // console.log(`Fee with an OP_RETURN buffer size of ${bufSize}: ${fee}`)

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
  getNecessaryUtxosAndChange (
    outputs,
    availableUtxos,
    bufLen,
    satsPerByte = 1.0
  ) {
    const sortedUtxos = this.sendBch.sortUtxosBySize(
      availableUtxos,
      'ASCENDING'
    )
    // console.log(`sortedUtxos: ${JSON.stringify(sortedUtxos, null, 2)}`)

    // const satsPerByte = 1.0

    // Calculate the miner fee, assuming inputs (this cost will be added later).
    // Change is assumed, that is the +1.
    const fee = this.calculateFee(0, outputs.length + 1, bufLen, satsPerByte)
    // console.log(`fee: ${fee}`)

    // Calculate the satoshis needed (minus the fee for each input)
    const satoshisToSend = outputs.reduce(
      (acc, receiver) => acc + receiver.amountSat,
      0
    )
    let satoshisNeeded = satoshisToSend + fee + PSF_DONATION
    // console.log(`satoshis needed: ${satoshisNeeded}`)

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

  // Build the transaction for sending a TX with an OP_RETURN output.
  // Note: SLP token UTXOs should not be sent to this function. They will be
  // burned.
  // An optional prefix is expected, as a hex string. If not provided, it will
  // default to the memo.cash prefix for posting a 'tweet'.
  //
  // Other outputs can be added for sending BCH to. This can be useful for signaling.
  // The bchOutput array should contain objects with a 'address' and 'amountSat'
  // properties.
  //
  // The sats-per-byte can be increased from the default of 1, for times when
  // the blockchain is congested and a fee market occurs.
  async createTransaction (
    walletInfo,
    bchUtxos,
    msg = '', // OP_RETURN data in utf8 string format.
    prefix = '6d02', // Hex prefix. Replace with Lokad ID or memo.cash prefix.
    bchOutput = [], // Array of objects with address and amountSat property
    satsPerByte = 1.0
  ) {
    try {
      // console.log('createTransaction() start tokenUtxos: ', tokenUtxos)

      // If the BCH utxos array is still empty, then throw an error.
      if (!bchUtxos || bchUtxos.length === 0) {
        throw new Error('BCH UTXO list is empty')
      }

      // Generate the OP_RETURN data.
      const script = [
        this.bchjs.Script.opcodes.OP_RETURN,
        Buffer.from(prefix, 'hex'),
        Buffer.from(msg)
      ]
      const data = this.bchjs.Script.encode2(script)
      // console.log('data.length: ', data.length)

      // Generate the BCH output object.
      // const bchOutput = [
      //   {
      //     address: walletInfo.cashAddress,
      //     amountSat: 550 // dust
      //   }
      // ]

      // Determine the UTXOs needed to be spent for this TX, and the change
      // that will be returned to the wallet.
      const { necessaryUtxos, change } = this.getNecessaryUtxosAndChange(
        bchOutput,
        bchUtxos,
        data.length,
        satsPerByte
      )

      // Create an instance of the Transaction Builder.
      const transactionBuilder = new this.bchjs.TransactionBuilder()

      // Add BCH inputs
      necessaryUtxos.forEach(utxo => {
        transactionBuilder.addInput(utxo.tx_hash, utxo.tx_pos)
      })

      // console.log('tokens.js tokenUtxos: ', tokenUtxos)

      // Add the OP_RETURN as the second output of the transaction.
      transactionBuilder.addOutput(data, 0)

      // Send a 2000 sat donation to PSF to thank them for creating this awesome software.
      // console.log(`psf: ${bchDonation('psf').donations}`)
      transactionBuilder.addOutput(bchDonation('psf').donations, PSF_DONATION)

      // Send change back to the wallet, if it's bigger than dust.
      // console.log(`change: ${change}`)
      // console.log(`walletInfo.cashAddress: ${walletInfo.cashAddress}`)
      if (change && change > 546) {
        transactionBuilder.addOutput(walletInfo.cashAddress, change)
      }

      // Add any additional outputs specified by the user.
      for (let i = 0; i < bchOutput.length; i++) {
        const thisOutput = bchOutput[i]
        transactionBuilder.addOutput(thisOutput.address, thisOutput.amountSat)
      }

      // Generate a key pair from the mnemonic.
      const keyPair = await this.sendBch.getKeyPairFromMnemonic(walletInfo)

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
      console.error('Error in op-return.js/createTransaction()')
      throw err
    }
  }

  // Generate and broadcast a TX with an OP_RETURN output. Returns the TXID
  // of the transaction.
  async sendOpReturn (
    wallet,
    bchUtxos,
    msg = '',
    prefix = '6d02', // Default to memo.cash
    bchOutput = [],
    satsPerByte = 1.0
  ) {
    const { hex } = await this.createTransaction(
      wallet,
      bchUtxos,
      msg,
      prefix,
      bchOutput,
      satsPerByte
    )

    // Broadcast the transaction to the network.
    const txid = await this.ar.sendTx(hex)

    return txid
  }
}

module.exports = OpReturn
