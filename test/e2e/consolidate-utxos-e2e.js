/*
  This is e2e test that exercises the consolidateUtxos() function.

  It is assumed that you prep the wallet with UTXOs before executing this script.
*/

// Local libraries
const SlpWallet = require('../../index.js')

const mnemonic = 'vital man apology edge load license rubber whip blue menu lens alarm'
// KycKzy9fRPvoVr5zJQSyrYdCqeNvTdj7JdbyZnRirvyf3KoouKDq
// bitcoincash:qq2tk7vedkp5hj3smpmz6let49q9u4wu9ga9tmyfcc

// Top-level function for this test.
async function testOptimization () {
  try {
    const wallet = new SlpWallet(mnemonic, { interface: 'consumer-api' })

    const result = await wallet.optimize()
    console.log('result: ', result)
  } catch (err) {
    console.error('Error in testOptimization(): ', err)
  }
}
testOptimization()
