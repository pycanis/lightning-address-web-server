const parseLightningAddress = (address) => {
  if (!address) {
    throw new Error('Lightning Address must be defined')
  }

  const lnAddressParts = address.split('@')

  const alias = lnAddressParts[0]
  const domain = lnAddressParts[1]

  return { alias, domain }
}

module.exports = {
  parseLightningAddress
}