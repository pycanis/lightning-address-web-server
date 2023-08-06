require('dotenv').config()

const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const express = require('express')
const crypto = require('crypto');
const { parseLightningAddress } = require('./utils')

const LN_ADDRESS = process.env.LN_ADDRESS

const { alias, domain } = parseLightningAddress(LN_ADDRESS)

const LND_GRPC_HOST = process.env.LND_GRPC_HOST ?? "127.0.0.1:10009"
const LND_CERT_PATH = process.env.LND_CERT_PATH ?? "~/.lnd/tls.cert"
const LND_MACAROON_PATH = process.env.LND_MACAROON_PATH ?? "~/.lnd/data/chain/bitcoin/mainnet/admin.macaroon"
const QR_CODE = process.env.QR_CODE

const lnrpcDescriptor = grpc.loadPackageDefinition(
  protoLoader.loadSync('lightning.proto', {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  })
);

const lnrpc = lnrpcDescriptor.lnrpc

const lndCert = grpc.credentials.createSsl(require('fs').readFileSync(LND_CERT_PATH));

const macaroonCreds = grpc.credentials.createFromMetadataGenerator((_, cb) => {
  const adminMacaroon = require('fs').readFileSync(LND_MACAROON_PATH).toString('hex');

  const metadata = new grpc.Metadata();

  metadata.add('macaroon', adminMacaroon);

  cb(null, metadata);
});

const creds = grpc.credentials.combineChannelCredentials(lndCert, macaroonCreds);

const lnd = new lnrpc.Lightning(LND_GRPC_HOST, creds);

const app = express()

const port = process.env.PORT ?? 7000

const addInvoice = async (amount, description_hash) => {
  try {
    return new Promise((resolve, reject) => {
      lnd.addInvoice({ value: amount / 1000, description_hash }, (err, response) => {
        if (err) reject(err);

        else {
          console.log('Invoice created successfully!');
          console.log('Payment Request:', response.payment_request);

          resolve(response.payment_request)};
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

app.get(`/.well-known/lnurlp/${alias}`, async (req, res) => {
  console.log(`Request received:`)
  console.log({ query: req.query, headers: req.headers, url: req.url })

  const metadata = JSON.stringify([["text/identifier", LN_ADDRESS], ["text/plain", `Sats for ${LN_ADDRESS}`], ...(QR_CODE ? [["image/png;base64", QR_CODE]] : [])])

  const amount = req.query.amount

  if (amount) {
    const paymentRequest = await addInvoice(amount, sha256(metadata))

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