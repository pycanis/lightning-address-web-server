const fs = require('fs');
const qrcode = require('qrcode');

if (!process.env.LN_ADDRESS) {
  throw new Error('Lightning Address must be defined')
}

// Function to generate the QR code and save it as a PNG file
async function generateQrCode() {
  try {
    const qrCodeDataUrl = await qrcode.toDataURL(process.env.LN_ADDRESS);

    const qrCodeImage = qrCodeDataUrl.split(',')[1]; // Remove data URI prefix

    console.log(qrCodeDataUrl)

    console.log(qrCodeImage)

    fs.writeFileSync('qr_code.png', qrCodeImage, 'base64');
    
    console.log('QR code generated and saved as qr_code.png');
  } catch (error) {
    console.error('Error generating QR code:', error);
  }
}

generateQrCode();