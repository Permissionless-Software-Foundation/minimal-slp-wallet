/*
  Donation addresses previously provided by the bch-donation package.
  That package listed apidoc as a production dependency, which pulled a
  vulnerable tree into every consumer install. Only the address lookup is used.
*/

const orgs = [
  {
    org: 'psf',
    description: 'Permissionless Software Foundation',
    website: 'https://psfoundation.cash',
    addresses: {
      donations: 'bitcoincash:qqsrke9lh257tqen99dkyy2emh4uty0vky9y0z0lsr'
    }
  },
  {
    org: 'abc',
    description: 'Bitcoin ABC',
    website: 'https://www.bitcoinabc.org/',
    addresses: {
      donations: 'bitcoincash:qqeht8vnwag20yv8dvtcrd4ujx09fwxwsqqqw93w88'
    }
  },
  {
    org: 'bchd',
    description: 'BCHD full node in Go',
    website: 'https://bchd.cash/',
    addresses: {
      donations: 'bitcoincash:qrhea03074073ff3zv9whh0nggxc7k03ssh8jv9mkx'
    }
  }
]

// Retrieve the addresses object for a matching organization.
function getAddress (org) {
  const matches = orgs.filter(item => item.org === org)

  if (!matches.length) {
    throw new Error('Could not find an organization with that handle.')
  }

  return matches[0].addresses
}

export default getAddress
