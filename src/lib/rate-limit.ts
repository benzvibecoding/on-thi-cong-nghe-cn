/** Sliding-window rate limiter (per-instance memory).
 * Free and dependency-free. Limitation: counters do not share across
 * serverless instances — pair with a Supabase table limiter when M9 is live.
 */
export class RateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly maxHits: number,
    private readonly windowMs: number
  ) {}

  /** Returns true when the call is allowed (and recorded). */
  allow(key: string, now: number = Date.now()): boolean {
    const cutoff = now - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((t) => t > cutoff);
    if (recent.length >= this.maxHits) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }
}
