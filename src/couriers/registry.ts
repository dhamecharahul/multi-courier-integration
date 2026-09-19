import { CourierAdapter } from "./types";
import { AppError } from "../utils/errors";

export class CourierRegistry {
  private adapters = new Map<string, CourierAdapter>();

  register(adapter: CourierAdapter) {
    this.adapters.set(adapter.name.toLowerCase(), adapter);
  }

  get(name: string): CourierAdapter {
    const adapter = this.adapters.get(name.toLowerCase());
    if (!adapter) {
      throw new AppError(
        "UNSUPPORTED_COURIER",
        `Unsupported courier partner: ${name}`,
        400,
        [{ field: "courier_partner", message: `Supported couriers: ${this.supported().join(", ")}` }]
      );
    }
    return adapter;
  }

  supported() {
    return [...this.adapters.keys()];
  }
}
