import 'dotenv/config'
import { parseEnv } from 'znv'
import { z } from 'zod'

export const { POSTGRES_URL, POSTGRES_CA_CERT_PATH } = parseEnv(process.env, {
  POSTGRES_URL: z.string().min(1),
  POSTGRES_CA_CERT_PATH: z.string().min(1).nullish()
})
