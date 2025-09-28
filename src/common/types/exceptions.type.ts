export interface ValidationErrorResponse {
  statusCode: number;
  message: string;
  errors: Record<string, string>;
}

export interface DefaultErrorResponse {
  statusCode: number;
  message: string | string[];
}
