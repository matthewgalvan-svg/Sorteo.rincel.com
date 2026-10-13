/** Interfaz del binding de Rate Limiting de Cloudflare (opcional). */
export interface RateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>
}

/**
 * Limitador en memoria por instancia: respaldo cuando no hay binding de Cloudflare.
 * Es "mejor esfuerzo" (cada instancia lleva su propia cuenta); la protección principal
 * es Turnstile + la regla de rate limiting del WAF/binding descrita en el README.
 */
export class MemoryRateLimiter {
  private hits = new Map<string, number[]>()

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
  ) {}

  check(key: string, now = Date.now()): boolean {
    const recent = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs)
    if (recent.length >= this.max) {
      this.hits.set(key, recent)
      return false
    }
    recent.push(now)
    this.hits.set(key, recent)
    if (this.hits.size > 5000) this.prune(now)
    return true
  }

  private prune(now: number) {
    for (const [key, times] of this.hits) {
      if (times.every((t) => now - t >= this.windowMs)) this.hits.delete(key)
    }
  }
}
