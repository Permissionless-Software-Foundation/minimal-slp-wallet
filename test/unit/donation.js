/*
  Unit tests for lib/donation.js
*/

import chai from 'chai'
import bchDonation from '../../lib/donation.js'

const { assert } = chai

describe('#donation', () => {
  it('should return the PSF donation address', () => {
    const addr = bchDonation('psf')

    assert.equal(
      addr.donations,
      'bitcoincash:qqsrke9lh257tqen99dkyy2emh4uty0vky9y0z0lsr'
    )
  })

  it('should return the other published donation addresses', () => {
    assert.equal(
      bchDonation('abc').donations,
      'bitcoincash:qqeht8vnwag20yv8dvtcrd4ujx09fwxwsqqqw93w88'
    )
    assert.equal(
      bchDonation('bchd').donations,
      'bitcoincash:qrhea03074073ff3zv9whh0nggxc7k03ssh8jv9mkx'
    )
  })

  it('should throw if the organization is unknown', () => {
    try {
      bchDonation('nope')
      assert.fail('Unexpected code path')
    } catch (err) {
      assert.include(err.message, 'Could not find an organization')
    }
  })
})
