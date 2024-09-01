const subscribeInvoices = ({ lnd, commentsMap }) => {
  const subscriber = lnd.subscribeInvoices({
    add_index: null,
    settle_index: null
  })

  subscriber.on('data', async (data) => {
    const { state, payment_request } = data

    const comment = commentsMap.get(payment_request)

    if (state === 'OPEN') {
      await fetch(process.env.NTFY_URL, { method: "POST", headers: { Priority: 3, Title: `New LN invoice generated for ${data.value} sats.`, Authorization: process.env.NTFY_AUTH }, body: comment ? `Comment: ${comment}` : 'No comment :(' })
    }

    if (state === 'SETTLED') {
      await fetch(process.env.NTFY_URL, { method: "POST", headers: { Priority: 3, Title: `LN invoice of ${data.value} sats was paid.`, Authorization: process.env.NTFY_AUTH }, body: comment ? `Comment: ${comment}` : 'No comment :(' })
    }
  })
}

module.exports = {
  subscribeInvoices
}