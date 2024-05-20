const parseLightningAddress = (lightningAddress) => {
  if (!lightningAddress) {
    throw new Error('Lightning Address must be defined')
  }

  const lnAddressParts = lightningAddress.split('@')

  const alias = lnAddressParts[0]
  const domain = lnAddressParts[1]

  return { alias, domain }
}

const getLnurl = (lightningAddress) => {
  const { alias, domain } = parseLightningAddress(lightningAddress)

  return `https://${domain}/.well-known/lnurlp/${alias}`
}

module.exports = {
  parseLightningAddress,
  getLnurl
}