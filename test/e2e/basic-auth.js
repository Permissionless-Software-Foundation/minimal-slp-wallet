/*
  The purpose of this script is test and debug the usage of a Basic Authorization
  token for connecting minimal-slp-wallet to private instances of bch-api.
  Private instances of bch-api use Basic Authentiation instead of JWT tokens.

  It assumes that the Basic Auth token has been placed in the BCHJSAUTHPASS_TEMP
  environment variable.
*/

// Global npm libraries

// Local libraries
const BchWallet = require('../../index')

async function startTest() {
  try {
    const wallet = new BchWallet(undefined, {
      authPass: process.env.BCHJSAUTHPASS_TEMP,
      restURL: process.env.BCHAPIURL
    })

    for(let i=0; i < 5; i++) {
      const result = await wallet.getUtxos('bitcoincash:qqlrzp23w08434twmvr4fxw672whkjy0py26r63g3d')
      console.log(`result ${i}: ${JSON.stringify(result, null, 2)}`)
    }
  } catch(err) {
    console.log('Error: ', err)
  }
}
startTest()
