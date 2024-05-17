const express = require('express')
const crypto = require('crypto');
const { parseLightningAddress } = require('./utils')

const LN_ADDRESS = process.env.LN_ADDRESS
const QR_CODE = process.env.QR_CODE

const app = express()

const { alias, domain } = parseLightningAddress(LN_ADDRESS)

const addInvoice = async ({ amount, description_hash, description, lnd }) => {
  try {
    return new Promise((resolve, reject) => {
      lnd.addInvoice({ value: amount / 1000, description_hash: description ? undefined : description_hash, memo: description }, (err, response) => {
        if (err) reject(err);

        else {
          console.log('Invoice created successfully!');
          console.log('Payment Request:', response.payment_request);

          resolve(response.payment_request)
        };
      });
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
  }
}

const sha256 = (input) => {
  const hash = crypto.createHash('sha256');

  hash.update(input);

  return hash.digest('base64');
}

const startLnAddressService = ({ port, lnd, commentsMap }) => {
  app.get(`/.well-known/lnurlp/${alias}`, async (req, res) => {
    console.log(`Request received:`)
    console.log({ query: req.query, headers: req.headers, url: req.url })

    const metadata = JSON.stringify([["text/plain", `Sats for ${LN_ADDRESS}`], ...(QR_CODE ? [["image/png;base64", QR_CODE]] : [])])

    // comment is meant to be made by user making a payment
    // description is made by my services
    const { amount, comment, description } = req.query

    if (amount) {
      const paymentRequest = await addInvoice({ amount, description_hash: sha256(metadata), description, lnd })

      if (comment) {
        commentsMap.set(paymentRequest, comment)
      }

      return res.json({
        pr: paymentRequest,
        routes: [],
        successAction: {
          tag: "message",
          message: "Thank you so much!"
        },
      })
    }

    res.json({
      callback: `https://${domain}/.well-known/lnurlp/${alias}`,
      tag: "payRequest",
      maxSendable: 1000000000,
      minSendable: 1000,
      commentAllowed: 200,
      metadata,
    })
  })

  app.listen(port, () => {
    console.log(`Node LND listening on port ${port}`)
  })
}

module.exports = {
  startLnAddressService
}