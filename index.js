require('dotenv').config()

const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const { startLnAddressService } = require('./lnaddress');
const { subscribeInvoices } = require('./subscribeinvoices');

const LND_GRPC_HOST = process.env.LND_GRPC_HOST ?? "127.0.0.1:10009"
const LND_CERT_PATH = process.env.LND_CERT_PATH ?? "~/.lnd/tls.cert"
const LND_MACAROON_PATH = process.env.LND_MACAROON_PATH ?? "~/.lnd/data/chain/bitcoin/mainnet/admin.macaroon"

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

const port = process.env.PORT ?? 7000

const commentsMap = new Map()

startLnAddressService({ port, lnd, commentsMap })
subscribeInvoices({ lnd, commentsMap })