import { describe, expect, it, vi } from "vitest";
import { withRetry } from "../src/utils/retry";

describe("withRetry", () => {
  it("retries retryable failures and eventually succeeds", async () => {
    const op = vi.fn()
      .mockRejectedValueOnce({ retryable: true })
      .mockRejectedValueOnce({ retryable: true })
      .mockResolvedValue("ok");

    await expect(withRetry(op, { maxAttempts: 3, baseDelayMs: 0 })).resolves.toBe("ok");
    expect(op).toHaveBeenCalledTimes(3);
  });

  it("does not retry non-retryable failures", async () => {
    const op = vi.fn().mockRejectedValue({ retryable: false });
    await expect(withRetry(op, { maxAttempts: 3, baseDelayMs: 0 })).rejects.toEqual({ retryable: false });
    expect(op).toHaveBeenCalledTimes(1);
  });
});
