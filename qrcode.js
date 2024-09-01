require('dotenv').config()

const fs = require('fs');
const qrcode = require('qrcode');
const { bech32 } = require("bech32");

const getLnurl = (lightningAddress) => {
  const lnAddressParts = lightningAddress.split('@')

  const alias = lnAddressParts[0]
  const domain = lnAddressParts[1]

  return `https://${domain}/.well-known/lnurlp/${alias}`
}

const bech32EncodeLnurl = (lnurl) => {
  const words = bech32.toWords(Buffer.from(lnurl, 'utf8'))

  const bech32Encoded = bech32.encode("lnurl", words)

  return bech32Encoded
}

const toUpperCaseIfNeeded = (data) => data.includes('lnurl') ? data.toUpperCase() : data

async function generateQrCode() {
  const address = process.argv[2]

  if (!address) {
    throw new Error('Address must be defined')
  }

  const data = address.includes('@') ? bech32EncodeLnurl(getLnurl(address)) : address

  console.log(data)

  try {
    const qrCodeDataUrl = await qrcode.toDataURL(toUpperCaseIfNeeded(data));

    const qrCodeImage = qrCodeDataUrl.split(',')[1]; // Remove data URI prefix

    console.log(qrCodeImage)

    const fileName = `${address}.png`

    fs.writeFileSync(fileName, qrCodeImage, 'base64');

    console.log(`QR code generated and saved as ${fileName}`);
  } catch (error) {
    console.error('Error generating QR code:', error);
  }
}

generateQrCode();