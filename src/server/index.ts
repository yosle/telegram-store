import type { AddressInfo } from 'node:net'
import crypto from 'node:crypto'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { serve } from '@hono/node-server'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { webhookCallback } from 'grammy'
import { getPath } from 'hono/utils/url'
import axios from 'axios'
import { PrismaClient } from '@prisma/client'
import { requestId } from './middlewares/request-id.js'
import { logger } from './middlewares/logger.js'
import type { Env } from './environment.js'
import type { Bot } from '#root/bot/index.js'
import { config } from '#root/config.js'
import { requestLogger } from '#root/server/middlewares/request-logger.js'
import { base64URLEncode, sha256 } from '#root/bot/helpers/oauth.js'

const tropipay_scope: string = config.TPP_SCOPES// Scope of the access request
const clientId: string = config.TPP_CLIENT_ID // Client identifier at the Authorization Server

const redirect_uri: string = `${config.OAUTH_REDIRECT_URI}`

// const prisma = new PrismaClient()

export function createServer(bot: Bot) {
  const server = new Hono<Env>()

  server.use(requestId())
  server.use(logger())

  if (config.isDev)
    server.use(requestLogger())

  server.onError(async (error, c) => {
    if (error instanceof HTTPException) {
      if (error.status < 500)
        c.var.logger.info(error)
      else
        c.var.logger.error(error)

      return error.getResponse()
    }

    // unexpected error
    c.var.logger.error({
      err: error,
      method: c.req.raw.method,
      path: getPath(c.req.raw),
    })
    return c.json(
      {
        error: 'Oops! Something went wrong.',
      },
      500,
    )
  })

  server.get('/', c => c.json({ status: true }))

  server.get(
    '/login',
    async (c) => {
      const tpp_server: string = config.TPP_SERVER// Authorization Server's Issuer Identifier
      const code_verifier: string = base64URLEncode(crypto.randomBytes(64))
      const code_challenge = base64URLEncode(sha256(code_verifier))
      const state = crypto.randomBytes(8).toString('hex')

      setCookie(c, 'state', state)
      setCookie(c, 'code_verifier', code_verifier)
      setCookie(c, 'sid', 'qwerty123')

      const linkParams = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        code_challenge,
        code_challenge_method: 'S256',
        state,
        scope: tropipay_scope,
        redirect_uri,
      })

      c.var.logger.info(linkParams)

      // now redirect the user to redirectTo.href

      const redirectUrl = `${tpp_server}/api/v2/access/authorize?${linkParams.toString()}`

      return c.redirect(redirectUrl)
    },
  )
  server.get(
    '/oauth/callback',
    async (c) => {
      // Get all query parameters as a URLSearchParams object
      const queries = c.req.query()
      const clientId: string = config.TPP_CLIENT_ID // Client identifier at the Authorization Server
      const clientSecret: string = config.TPP_CLIENT_SECRET// Client Secret

      // Access specific query parameters
      const code = c.req.query('code') // For example, the 'code' parameter
      const state = c.req.query('state') // If there's a 'state' parameter
      const code_verifier = getCookie(c, 'code_verifier')
      const sid = getCookie(c, 'sid')

      if (!state || !code) {
        return c.html(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error</title>
            <style>
              body { font-family: Arial, sans-serif; background: #f4f4f4; color: #333; text-align: center; padding: 50px; }
              h1 { color: #ff6347; }
              a { color: #007BFF; text-decoration: none; }
              a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <h1>Oops, something went wrong!</h1>
            <p>We encountered an error while processing your request.</p>
            <p><a href="/">Go back to Home</a></p>
          </body>
          </html>
        `)
      }

      c.var.logger.info(`Callback queries: ${JSON.stringify(queries)}`)
      c.var.logger.info(`Code: ${code}`)
      c.var.logger.info(`State: ${state}`)
      c.var.logger.info(`Code verifier ${code_verifier}`)
      c.var.logger.info(`Session ID: ${sid}`)
      c.var.logger.info(`State from cookie: ${getCookie(c, 'state')}`)

      try {
        const token = await axios.post(
          `${config.TPP_SERVER}/api/v2/access/token`,
          {
            grant_type: 'authorization_code',
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: 'https://t.me/tropigram?start=123434', // todo
            code_verifier,
            scope: tropipay_scope,
          },
          {
            headers: { 'Content-Type': 'application/json' },
          },
        )
        const access_token = token.data.access_token
        c.var.logger.debug(`TPP TOKEN: ${access_token}`)
        // save in database
        const profileData = await axios({
          headers: { Authorization: `Bearer ${access_token}` },
          url: `${config.TPP_SERVER}/api/users/profile`,
        })
        const data = profileData?.data
        c.var.logger.debug(`profile data from user ${JSON.stringify(data)}`)

        deleteCookie(c, 'state')
        deleteCookie(c, 'code_verifier')

        return c.html(`
          <!DOCTYPE html>
   <html lang="en">
   <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <title>Conexión Exitosa</title>
     <style>
       body {
         font-family: Arial, sans-serif;
         background: #f4f4f4;
         color: #333;
         text-align: center;
         padding: 50px;
       }
       h1 {
         color: #28a745;
       }
       p {
         margin: 15px 0;
       }
       a {
         color: #007BFF;
         text-decoration: none;
       }
       a:hover {
         text-decoration: underline;
       }
       .button {
         display: inline-block;
         margin-top: 20px;
         padding: 10px 20px;
         background-color: #007BFF;
         color: #fff;
         text-decoration: none;
         border-radius: 5px;
         font-size: 16px;
       }
       .button:hover {
         background-color: #0056b3;
       }
     </style>
   </head>
   <body>
     <h1>¡Conexión Exitosa!</h1>
     <p>Tu cuenta Tropipay se ha conectado correctamente.</p>
     <p>Si no se abre Telegram automáticamente, haz clic en el siguiente enlace:</p>
     <a class="button" href="tg://resolve?domain=YourTelegramBot">Abrir Telegram</a>
   </body>
   </html>   
         `)
      }

      catch (error) {
        c.var.logger.error(error)
        return c.html(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error</title>
            <style>
              body { font-family: Arial, sans-serif; background: #f4f4f4; color: #333; text-align: center; padding: 50px; }
              h1 { color: #ff6347; }
              a { color: #007BFF; text-decoration: none; }
              a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <h1>Oops, something went wrong!</h1>
            <p>We encountered an error while processing your request.</p>
            <p><a href="/">Go back to Home</a></p>
          </body>
          </html>
        `)
      }
    },
  )
  server.post(
    '/webhook',
    webhookCallback(bot, 'hono', {
      secretToken: config.BOT_WEBHOOK_SECRET,
    }),
  )

  return server
}

export type Server = Awaited<ReturnType<typeof createServer>>

export function createServerManager(server: Server) {
  let handle: undefined | ReturnType<typeof serve>
  return {
    start: (host: string, port: number) =>
      new Promise<AddressInfo>((resolve) => {
        handle = serve(
          {
            fetch: server.fetch,
            hostname: host,
            port,
          },
          info => resolve(info),
        )
      }),
    stop: () =>
      new Promise<void>((resolve) => {
        if (handle)
          handle.close(() => resolve())
        else
          resolve()
      }),
  }
}
