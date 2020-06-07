/*
  A mocking library for util.js unit tests.
  A mocking library contains data to use in place of the data that would come
  from an external dependency.
*/

'use strict'

const mockBalance = {
  page: 1,
  totalPages: 1,
  itemsOnPage: 1000,
  address: 'bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7',
  balance: '1000',
  totalReceived: '1000',
  totalSent: '0',
  unconfirmedBalance: '0',
  unconfirmedTxs: 0,
  txs: 1,
  txids: ['6181c669614fa18039a19b23eb06806bfece1f7514ab457c3bb82a40fe171a6d']
}

const mockUtxos = [
  {
    txid: '6181c669614fa18039a19b23eb06806bfece1f7514ab457c3bb82a40fe171a6d',
    vout: 0,
    value: '1000',
    height: 601861,
    confirmations: 4560,
    satoshis: 1000
  }
]

module.exports = {
  mockBalance,
  mockUtxos
}
