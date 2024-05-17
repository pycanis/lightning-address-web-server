const subscribeInvoices = ({ lnd, commentsMap }) => {
  const subscriber = lnd.subscribeInvoices({
    add_index: null,
    settle_index: null
  })

  subscriber.on('data', async (data) => {
    const { state, payment_request } = data

    const comment = commentsMap.get(payment_request)

    if (state === 'OPEN') {
      await fetch(process.env.NTFY_URL, { method:"POST", headers: { Priority: 3, Title: `New LN invoice generated for ${data.value} sats.`, Authorization: process.env.NTFY_AUTH }, body: comment ? `Comment: ${comment}` : undefined })
    }

    if (state === 'SETTLED') {
      await fetch(process.env.NTFY_URL, { method:"POST", headers: { Priority: 3, Title: `LN invoice of ${data.value} sats was paid.`, Authorization: process.env.NTFY_AUTH }, body: comment ? `Comment: ${comment}` : undefined })

      // for (const lnJukeboxWebhookUrl of lnJukeboxWebhookUrls) {
      //   try {
      //     await axios.post(lnJukeboxWebhookUrl, { paymentRequest: payment_request },
      //       { headers: { Authorization: process.env.LN_JUKEBOX_WEBHOOK_SECRET } })
      //   } catch (e) {
      //     console.log(`failed to push update to ln jukebox - ${lnJukeboxWebhookUrl}`)
      //   }
      // }
    }
  })
}

module.exports = {
  subscribeInvoices
}