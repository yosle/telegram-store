import { createCallbackData } from 'callback-data'

export const connectToTropipay = createCallbackData('connect-to-tpp', {
  token: String,
})
