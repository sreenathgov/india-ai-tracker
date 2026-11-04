import "server-only";
import { createHash } from "node:crypto";

const WINDOW = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const CAPACITY = 2048;
const buckets = new Map<string, { startedAt: number; count: number }>();

/** Secondary defense only: separate serverless instances do not share this map. */
export function allowLocalLoginAttempt(request: Request, username: string, now = Date.now()): boolean {
  // The username bucket is not bypassable by spoofing forwarding headers. Production
  // also requires a deployed persistent edge IP rate-limit rule before login opens.
  const key = createHash("sha256").update(username.slice(0, 64)).digest("hex");
  let bucket = buckets.get(key);
  if (!bucket || now - bucket.startedAt >= WINDOW) {
    if (buckets.size >= CAPACITY) {
      for (const [id, value] of buckets) if (now - value.startedAt >= WINDOW) buckets.delete(id);
      if (buckets.size >= CAPACITY) return false;
    }
    bucket = { startedAt: now, count: 0 };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  return bucket.count <= MAX_ATTEMPTS;
}

export function clearLocalLoginLimitsForTesting(): void {
  if (process.env.NODE_ENV === "test") buckets.clear();
}
