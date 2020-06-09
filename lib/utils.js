/*
  Simple utility functions shared by the different libraries.
*/

class Utils {
  sortUtxosBySize (utxos, sortingOrder = 'ASCENDING') {
    if (sortingOrder === SortingOrder.ASCENDING) {
      return utxos.sort((a, b) => a.satoshis - b.satoshis)
    } else {
      return utxos.sort((a, b) => b.satoshis - a.satoshis)
    }
  }
}

module.exports = Utils
