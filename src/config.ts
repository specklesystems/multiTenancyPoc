import 'dotenv/config'
import { parseEnv } from 'znv'
import { z } from 'zod'

const config = parseEnv(process.env, {
  MAIN_DB_URI: z.string().min(1)
})

export default config
