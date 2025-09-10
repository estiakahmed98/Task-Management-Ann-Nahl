// types/user.ts
export type UserStatus = "active" | "inactive" | "suspended";

export interface UserInterface {
  id: string;
  email: string;
  name: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  category?: string | null;
  address?: string | null;
  biography?: string | null;
  status?: UserStatus;
  emailVerified: boolean;
  image?: string | null;
  createdAt: string;
  updatedAt: string;
  roleId?: string | null;
  role?: { id: string; name: string } | null;
  passwordHash?: string;
  clientId?: string | null;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  recentUsers: number;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  _count: {
    users: number;
  };
}

export interface FormData {
  name: string;
  firstName?: string;   // <-- add
  lastName?: string;    // <-- add
  email: string;
  password: string;
  roleId: string;
  phone?: string;
  address?: string;
  category?: string; // kept for backward compatibility (will store team name)
  clientId?: string; // for client role
  teamId?: string; // selected team id (optional)
  biography?: string;
  status: UserStatus;
}
