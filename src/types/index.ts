/**
 * B2B Trade & Logistics Platform
 * User Role and Profile TypeScript Definitions
 */

/**
 * Supported User Roles in the B2B Platform
 */
export enum UserRole {
  SUPER_ADMIN = 'super_admin', // CEO / Platform Owner
  SUPPLIER = 'supplier',       // Supplier Portal Users
  WAREHOUSE = 'warehouse',     // Warehouse Operators
  LOGISTICS = 'logistics',     // Logistics & Transport Providers
  CUSTOMER = 'customer',       // B2B Customers
}

/**
 * Standard User Profile database model
 * Corresponds to the 'profiles' table in Supabase
 */
export interface UserProfile {
  id: string;                  // Maps to auth.users.id
  email: string;
  role: UserRole;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * B2B Meta-data attached to Supabase Auth User
 * (Stored in user.app_metadata or user.user_metadata for fast role resolution without DB queries)
 */
export interface AuthUserMetadata {
  role?: UserRole;
  company_id?: string;
  profile_completed?: boolean;
}

/**
 * Mapping of Roles to their respective Dashboard Path prefixes
 */
export const ROLE_DASHBOARD_ROUTES: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: '/admin/dashboard',
  [UserRole.SUPPLIER]: '/supplier/dashboard',
  [UserRole.WAREHOUSE]: '/warehouse/dashboard',
  [UserRole.LOGISTICS]: '/logistics/dashboard',
  [UserRole.CUSTOMER]: '/customer/dashboard',
};

/**
 * Helper to validate if a string is a valid UserRole
 */
export function isValidRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}
