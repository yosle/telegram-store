import { createHash } from 'node:crypto'

export function base64URLEncode(str: any) {
  return str.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export function sha256(buffer: any) {
  return createHash('sha256')
    .update(buffer)
    .digest()
}
