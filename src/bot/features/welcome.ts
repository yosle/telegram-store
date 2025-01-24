import { Composer } from 'grammy'
import { connectToTropipay } from '../callback-data/connect-to-tpp.js'
import type { Context } from '#root/bot/context.js'
import { logHandle } from '#root/bot/helpers/logging.js'

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

feature.command('start', logHandle('command-start'), (ctx) => {
  if (ctx.session.isConnected) {
    return ctx.reply(`Bienvenido,${ctx.chat.first_name} usa los botones de abajo para ejecutar una accion`, {
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
    return ctx.reply(ctx.t('welcome'), {
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
