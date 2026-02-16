export enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER',
    GUEST = 'GUEST',
}

export type Role = keyof typeof UserRole;
