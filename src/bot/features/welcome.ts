import { Composer } from 'grammy'
import { PrismaClient } from '@prisma/client'
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

    ctx.session.isConnected = true
    ctx.session.tpp_token = tropipayToken

    // return ctx.editMessageText(ctx.t('language.changed'))
    return ctx.editMessageText('Conectado exitosamente')
  },
)

feature.command('start', logHandle('command-start'), async (ctx) => {
  const userIsRegistered = await prisma.user.findFirst({ where: {
    tgId: ctx.from.id,
  },
  })

  if (!userIsRegistered) {
    await prisma.user.create({
      data: {
        tgId: ctx.from.id,
        name: ctx.from.username || null,
      },
    })
  }

  if (ctx.session.isConnected) {
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
  else {
    // Fetch zero or more Sessions
    // const newConnecttry = await prisma.user.fields.
    return ctx.reply(ctx.t('sign_up_welcome', { userName: ctx.chat.first_name, terms: config.TERMS_LINK }), {
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
  }

  // return ctx.replyWithInvoice(' Wash machine', 'A awesome wash machine', '343', 'XTR', [
  //   {
  //     label: 'Wash',
  //     amount: 100,
  //   },
  // ])
})

export { composer as welcomeFeature }
