/*
  An example for sending tokens with this library.
*/

const SlpWallet = require('../index')

async function sendTokens () {
  try {
    // Replace the values for the constants below to customize for your use.
    const MNEMONIC =
      'essence appear intact casino neck scatter search post cube fit door margin'
    const RECIEVER = ''
    const TOKENID =
      '82e3d97b3cd033e60ffa755450b9075cf44fe1b2f6d5dc13657d8263e716b6a5'
    const TOKENS_TO_SEND = 1

    // Instantiate the wallet library.
    const slpWallet = new SlpWallet(MNEMONIC)

    // Wait for the wallet to be created.
    await slpWallet.walletInfoPromise

    // console.log('slpWallet.utxos.utxoStore: ', slpWallet.utxos.utxoStore)

    // Get the balance of the wallet.
    const balance = await slpWallet.getBalance()
    console.log(`balance: ${balance} satoshis`)

    // Exit if the wallet has no balance.
    if (balance === 0) {
      console.log(
        `The balance of your wallet is zero. Send BCH to ${
          slpWallet.walletInfo.address
        } to run this example.`
      )
      return
    }

    // Create the outputs array.
    let output = {}

    // If reciever is not specified, send the funds back to the wallet.
    if (RECIEVER === '') {
      output = {
        address: slpWallet.walletInfo.address,
        tokenId: TOKENID,
        qty: TOKENS_TO_SEND
      }
      //
      // Send the funds to the reciever.
    } else {
      output = {
        address: RECIEVER,
        tokenId: TOKENID,
        qty: TOKENS_TO_SEND
      }
    }

    const txid = await slpWallet.sendTokens(output)

    console.log(`Success! Tokens sent with TXID: ${txid}`)
  } catch (err) {
    console.error('Error: ', err)
  }
}
sendTokens()
