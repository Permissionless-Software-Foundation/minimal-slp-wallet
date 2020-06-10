/*
  An example for sending BCH with this library.
*/

const BchWallet = require('../index')

async function sendBch () {
  try {
    // Replace this mnemonic with the one created with the create-wallet.js example.
    const mnemonic =
      'question blossom series broom easy payment pipe betray kitchen siege yellow vocal'
    const reciever = ''
    const sats2Send = 1000

    // Instantiate the wallet library.
    const bchWallet = new BchWallet(mnemonic)

    // Wait for the wallet to be created.
    await bchWallet.walletInfoPromise

    // Get the balance of the wallet.
    const balance = await bchWallet.getBalance()
    console.log('balance: ', balance)

    // Exit if the wallet has no balance.
    if (balance === 0) {
      console.log(
        `The balance of your wallet is zero. Send BCH to ${
          bchWallet.walletInfo.address
        } to run this example.`
      )
      return
    }

    // Create the outputs array.
    const outputs = []
    if (reciever === '') {
      outputs.push({
        address: bchWallet.walletInfo.address,
        amountSat: sats2Send
      })
    } else {
      outputs.push({
        address: reciever,
        amountSat: sats2Send
      })
    }

    const txid = await bchWallet.send(outputs)

    console.log(`Success! BCH sent with TXID: ${txid}`)
  } catch (err) {
    console.error('Error: ', err)
  }
}
sendBch()
