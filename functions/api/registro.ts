import { defaultMemoryLimiter, handleRegistro, type Env } from '../../server/registro'

// Cloudflare Pages Function: POST /api/registro
export const onRequest: PagesFunction<Env> = ({ request, env }) =>
  handleRegistro(request, env, {
    fetch: (input, init) => fetch(input, init),
    now: Date.now,
    memoryLimiter: defaultMemoryLimiter,
    log: (event, detail) => console.log(JSON.stringify({ event, ...detail })),
  })
