interface LocalUser extends Account { }
interface JwtUser extends JWT_Payload { }

declare global {
  namespace Express {
    interface Request {
      user?: LocalUser | JwtUser;
    }
  }
}
