const Discord = require('discord.js')

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL

const discordWebhookClient = new Discord.WebhookClient({ url: DISCORD_WEBHOOK_URL })

const subscribeInvoices = ({ lnd, commentsMap }) => {
 const subscriber = lnd.subscribeInvoices({
  add_index: null,
  settle_index: null
 })

 subscriber.on('data', async (data) => {
  const { state, payment_request } = data

  const comment = commentsMap.get(payment_request)

  if (state === 'OPEN') {
    await discordWebhookClient.send(`New LN invoice generated for ${data.value} sats. ${comment ? `Comment: ${comment}` : ''}`)
  }

  if (state === 'SETTLED') {
    await discordWebhookClient.send(`LN invoice of ${data.value} sats was paid. ${comment ? `Comment: ${comment}` : ''}`)
  }
 })
}

module.exports = {
  subscribeInvoices
}