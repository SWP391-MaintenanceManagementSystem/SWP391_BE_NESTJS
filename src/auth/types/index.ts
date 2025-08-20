export interface JWT_Payload {
  email: string;
  sub: string;
  role?: string;
  type: TokenType;
  iat?: number;
  exp?: number;
}

export enum TokenType {
  ACCESS = 'ACCESS',
  REFRESH = 'REFRESH',
  ACTIVATION = 'ACTIVATION',
  RESET_PASSWORD = 'RESET_PASSWORD',
}


