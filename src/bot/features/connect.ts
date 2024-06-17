import { Composer } from 'grammy'
import type { Context } from '#root/bot/context.js'
import { logHandle } from '#root/bot/helpers/logging.js'

const composer = new Composer<Context>()

const feature = composer.chatType('private')

feature.command('connect', logHandle('command-connect'), (ctx) => {
  return ctx.reply(ctx.t('connect_command.message'), {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Iniciar sesion',
            // eslint-disable-next-line node/prefer-global/process
            url: `${process.env.TROPIPAY_HOST}/api/v2/access/authorize?response_type=code&client_id=${process.env.TROPIPAY_CLIENT_ID}&redirect_uri=${process.env.TROPIPAY_CALLBACK}&scope=${process.env.TROPIPAY_SCOPES}&state=${process.env.STATE}`,

          },
        ],
      ],
    },
  })
})

export { composer as connectFeature }
