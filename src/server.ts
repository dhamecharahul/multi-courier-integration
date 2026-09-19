import mongoose from "mongoose";
import { config } from "./config";
import { createApp } from "./app";

async function main() {
  await mongoose.connect(config.mongoUri);
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`Multi-courier API listening on http://localhost:${config.port}`);
  });
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
