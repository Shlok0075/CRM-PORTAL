import * as crypto from 'crypto'

const ALGO = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const TAG_LENGTH = 16
const SALT_LENGTH = 16

function getKey(): Buffer {
  const secret = process.env.CRYPTO_SECRET || process.env.JWT_SECRET || 'dev-secret-change-me'
  return crypto.scryptSync(secret, 'crm-salt', KEY_LENGTH)
}

export function encrypt(text: string): string {
  if (!text) return text
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  const salt = crypto.randomBytes(SALT_LENGTH)
  return [salt.toString('base64'), iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join('.')
}

export function decrypt(payload: string): string {
  if (!payload) return payload
  const parts = payload.split('.')
  if (parts.length !== 4) return payload
  const [saltB64, ivB64, tagB64, encryptedB64] = parts
  const key = crypto.scryptSync((process.env.CRYPTO_SECRET || process.env.JWT_SECRET || 'dev-secret-change-me'), Buffer.from(saltB64, 'base64'), KEY_LENGTH)
  const iv = Buffer.from(ivB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')
  const encrypted = Buffer.from(encryptedB64, 'base64')
  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}

export function maskPassword(payload: string): string {
  if (!payload) return '***'
  return '••••••••'
}
