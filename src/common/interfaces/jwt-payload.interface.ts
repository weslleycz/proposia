import { Role } from "@prisma/client";

export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
  role: Role;
}
