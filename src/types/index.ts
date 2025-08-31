import { Role } from "@prisma/client";

export interface FilterOptions<T> {
    where?: Partial<Record<keyof T, any>>;
    orderBy?: Partial<Record<keyof T, 'asc' | 'desc'>>;
    skip?: number;
    take?: number;
}

export interface JWT_Payload {
    email: string;
    sub: string;
    role: Role;
    isVerified: boolean;
    iat?: number;
    exp?: number;
}

export enum TokenType {
    ACCESS = 'ACCESS',
    REFRESH = 'REFRESH',
    ACTIVATION = 'ACTIVATION',
    RESET_PASSWORD = 'RESET_PASSWORD',
}