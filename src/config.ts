import "dotenv/config";

const int = (name: string, fallback: number) => {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(value)) throw new Error(`Invalid numeric env: ${name}`);
  return value;
};

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: int("PORT", 3000),
  mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/multi_courier",
  logLevel: process.env.LOG_LEVEL ?? "info",
  bulk: {
    maxOrders: int("BULK_MAX_ORDERS", 100),
    concurrency: int("BULK_CONCURRENCY", 5)
  },
  retry: {
    maxAttempts: int("RETRY_MAX_ATTEMPTS", 3),
    baseDelayMs: int("RETRY_BASE_DELAY_MS", 300)
  },
  httpTimeoutMs: int("HTTP_TIMEOUT_MS", 10000),
  urbanebolt: {
    baseUrl: process.env.URBANEBOLT_BASE_URL ?? "https://uat.urbanebolt.in",
    username: process.env.URBANEBOLT_USERNAME ?? "",
    password: process.env.URBANEBOLT_PASSWORD ?? "",
    customerCode: process.env.URBANEBOLT_CUSTOMER_CODE ?? "",
    authPath: process.env.URBANEBOLT_AUTH_PATH ?? "/api/auth/login",
    createPath: process.env.URBANEBOLT_CREATE_PATH ?? "/api/order/create",
    trackPath: process.env.URBANEBOLT_TRACK_PATH ?? "/api/order/track",
    cancelPath: process.env.URBANEBOLT_CANCEL_PATH ?? "/api/order/cancel"
  }
};
