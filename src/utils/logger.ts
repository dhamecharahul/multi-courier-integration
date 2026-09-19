import pino from "pino";
import { config } from "../config";

export const logger = pino({
  level: config.logLevel,
  base: undefined,
  redact: ["req.headers.authorization", "body.password", "body.secret"]
});
