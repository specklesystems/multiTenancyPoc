import 'dotenv/config'
import { parseEnv } from 'znv'
import { z } from 'zod'

export const { POSTGRES_URL } = parseEnv(process.env, {
  POSTGRES_URL: z.string().min(1)
})

console.log([POSTGRES_URL].join(', '))
