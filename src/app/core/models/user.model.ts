export interface User {
  id?: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  lastLogin?: Date;
  avatar?: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  RECEPTIONIST = 'RECEPTIONIST',
  TECHNICIAN = 'TECHNICIAN',
}

export interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
}
