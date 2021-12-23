import express = require('express')
import dsc = require('discord.js')
import axios = require('axios')
import DbClient = require('@replit/database')
import { URL } from 'url'

import config from './config'

const app = express()

app.get('/', (req, res) => {
  res.status(404).send('Error 404')
})

app.listen(config.port, () => console.log('server started'))

const client = new dsc.Client({
  intents: [
    dsc.Intents.FLAGS.GUILDS, dsc.Intents.FLAGS.GUILD_MESSAGES,
  ]
})

client.on('ready', () => {
  console.log(`Ready`)
})

const normUrl = async (url: URL): Promise<string | null> => {
  if (url.hostname === 'soundcloud.app.goo.gl') {
    const result = await axios.default({ method: 'GET', url: url.href, timeout: 2000 })
    const redUrl = new URL(result.request.res.responseUrl)
    return redUrl.pathname
  }
  if (url.hostname === 'soundcloud.com') {
    return url.pathname
  }
  return null
}

const extractPath = async (str: string): Promise<string | null> => {
  try {
    const url = new URL(str)
    // Alternatively extract id from `https://w.soundcloud.com/player/?url=${url}`, but it would require
    // something like `puppeteer` as it redirects with js.
    const normPath = await normUrl(url)
    return normPath
  } catch (e) {
    console.log(e)
  }
  return null
}

const notify = async (msg: dsc.Message<boolean>, replyStr: string): Promise<void> => {
  const reply = await msg.reply(replyStr)
  await msg.delete()
  setTimeout(async () => {
    try {
      await reply.delete()
    } catch (e) {
      console.log(e)
    }
  }, 3000)
}

const dbClient = new DbClient()

client.on('messageCreate', async (msg): Promise<void> => {
  try {
    // Bot's id MUST be correct, otherwise it will be stuck in a recursion
    if (msg.author.id === config.botId) return
    const extrPath = await extractPath(msg.content)
    if (extrPath !== null) {
      const key = Buffer.from(extrPath).toString('base64')
      const val = await dbClient.get(key)
      if (val) {
        await notify(msg, config.existsMessage)
      } else {
        await dbClient.set(key, 1)
      }
    } else {
      await notify(msg, config.onlyLinksMessage)
    }
  } catch (e) {
    console.log(e)
  }
})

client.login(config.token)
