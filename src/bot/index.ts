import { autoChatAction } from '@grammyjs/auto-chat-action'
import { hydrate } from '@grammyjs/hydrate'
import { hydrateReply, parseMode } from '@grammyjs/parse-mode'
import type { BotConfig, StorageAdapter } from 'grammy'
import { Bot as TelegramBot, session } from 'grammy'
import { PrismaAdapter } from '@grammyjs/storage-prisma'
import { PrismaClient } from '@prisma/client'
import type {
  Context,
  SessionData,
} from '#root/bot/context.js'
import {
  createContextConstructor,
} from '#root/bot/context.js'
import {
  adminFeature,
  connectFeature,
  languageFeature,
  unhandledFeature,
  welcomeFeature,
} from '#root/bot/features/index.js'
import { errorHandler } from '#root/bot/handlers/index.js'
import { i18n } from '#root/bot/i18n.js'
import { updateLogger } from '#root/bot/middlewares/index.js'
import { config } from '#root/config.js'
import { logger } from '#root/logger.js'

interface Options {
  sessionStorage?: StorageAdapter<SessionData>
  config?: Omit<BotConfig<Context>, 'ContextConstructor'>
}

export function createBot(token: string, options: Options = {}) {
  const prisma = new PrismaClient()

  const bot = new TelegramBot(token, {
    ...options.config,
    ContextConstructor: createContextConstructor({ logger }),
  })
  const protectedBot = bot.errorBoundary(errorHandler)

  // Middlewares
  bot.api.config.use(parseMode('HTML'))

  if (config.isDev)
    protectedBot.use(updateLogger())

  protectedBot.use(autoChatAction(bot.api))
  protectedBot.use(hydrateReply)
  protectedBot.use(hydrate())

  protectedBot.use(
    session({
      initial: () => ({
        hasBeenConnected: false,
        tppToken: null,
        agreedTerms: false,
        tppTokenExpirationDate: null,
      }),
      storage: new PrismaAdapter(prisma.session),

    }),
  )
  protectedBot.use(i18n)

  // Handlers
  protectedBot.use(welcomeFeature)
  protectedBot.use(adminFeature)
  protectedBot.use(connectFeature)

  // if (isMultipleLocales)
  protectedBot.use(languageFeature)

  // must be the last handler
  protectedBot.use(unhandledFeature)

  return bot
}

export type Bot = ReturnType<typeof createBot>
