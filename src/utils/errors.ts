export type ErrorField = { field: string; message: string };

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 500,
    public readonly fields: ErrorField[] = [],
    public readonly retryable = false
  ) {
    super(message);
  }
}

export class CourierApiError extends AppError {
  constructor(
    code: string,
    message: string,
    statusCode: number,
    public readonly courierStatus?: number,
    public readonly raw?: unknown
  ) {
    super(code, message, statusCode);
  }
}
