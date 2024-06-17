import { Composer } from 'grammy'
import type { Context } from '#root/bot/context.js'
import { logHandle } from '#root/bot/helpers/logging.js'

const composer = new Composer<Context>()

const feature = composer.chatType('private')

feature.command('start', logHandle('command-start'), (ctx) => {
  return ctx.reply(ctx.t('welcome'), {
    reply_markup: {
      inline_keyboard: [
        [
          {
            callback_data: 'get-store',
            text: ctx.t('get_store'),
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
