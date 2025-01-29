import { Composer } from 'grammy'
import { PrismaClient } from '@prisma/client'
import { isBefore } from 'date-fns'
import { connectToTropipay } from '../callback-data/connect-to-tpp.js'
import type { Context } from '#root/bot/context.js'
import { logHandle } from '#root/bot/helpers/logging.js'
import { config } from '#root/config.js'

const prisma = new PrismaClient()

const composer = new Composer<Context>()

const feature = composer.chatType('private')

feature.callbackQuery(
  connectToTropipay.filter(),
  logHandle('connect-to-tpp'),
  async (ctx) => {
    const { token: tropipayToken } = connectToTropipay.unpack(
      ctx.callbackQuery.data,
    )

    ctx.session.hasBeenConnected = true
    ctx.session.tppToken = tropipayToken

    // return ctx.editMessageText(ctx.t('language.changed'))
    return ctx.editMessageText('Conectado exitosamente')
  },
)

feature.command('start', logHandle('command-start'), async (ctx) => {
  if (!ctx.from || !ctx.chat) {
    return ctx.reply('No se pudo procesar tu solicitud.')
  }
  await prisma.user.upsert({
    where: { tgId: ctx.from.id },
    update: {},
    create: {
      tgId: ctx.from.id,
      username: ctx.from.username || null,
    },
  })

  const now = new Date()
  if (ctx.session.hasBeenConnected && ctx.session.tppTokenExpirationDate
    && isBefore(now, new Date(ctx.session.tppTokenExpirationDate))) {
    return ctx.reply(`${ctx.t('welcome', { userName: ctx.chat.first_name })} ${ctx.chat.first_name}`, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              callback_data: 'get-store',
              text: 'Revisar Balance',
            },
          ],
        ],
      },
    })
  }

  // not connected or expired session
  return ctx.reply(ctx.t('sign_up_welcome', { userName: ctx.chat.first_name }), {
    reply_markup: {
      inline_keyboard: [
        [
          {
            callback_data: connectToTropipay.pack({
              token: 'localeCode',
            }),
            text: 'Conectar con Tropipay',
          },
        ],
        [
          {
            url: config.TERMS_LINK,
            text: ctx.t('see_terms_and_conditions'),
          },
        ],
      ],
    },
  })

  // return ctx.replyWithInvoice(' Wash machine', 'A awesome wash machine', '343', 'XTR', [
  //   {
  //     label: 'Wash',
  //     amount: 100,
  //   },
  // ])
})

export { composer as welcomeFeature }
