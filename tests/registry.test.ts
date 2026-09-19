import { describe, expect, it } from "vitest";
import { CourierRegistry } from "../src/couriers/registry";

describe("CourierRegistry", () => {
  it("resolves a courier case-insensitively", () => {
    const registry = new CourierRegistry();
    const adapter = { name: "mockcourier" } as any;
    registry.register(adapter);
    expect(registry.get("MockCourier")).toBe(adapter);
  });

  it("reports supported couriers for unknown partner", () => {
    const registry = new CourierRegistry();
    registry.register({ name: "mockcourier" } as any);
    expect(() => registry.get("unknown")).toThrow("Supported couriers: mockcourier");
  });
});
