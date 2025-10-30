/**
 * User Data Transfer Objects (DTOs)
 *
 * These DTOs provide simplified views of user data for specific UI needs.
 * They follow the Interface Segregation Principle (ISP) by exposing only
 * the data required for each specific use case.
 *
 * **Security Note:**
 * DTOs should never expose sensitive information like passwords or tokens.
 */

import type { User, UserRole } from '@/domain/entities/User'

/**
 * UserListDTO
 *
 * Simplified user information for list views and dropdowns.
 *
 * **Usage:**
 * - User management tables
 * - User selection dropdowns
 * - Admin assignment interfaces
 *
 * @example
 * ```typescript
 * const users: UserListDTO[] = [
 *   {
 *     id: 'user-1',
 *     email: 'admin@example.com',
 *     displayName: 'Admin User',
 *     role: 'Admin'
 *   }
 * ]
 * ```
 */
export interface UserListDTO {
  /**
   * Unique user identifier
   */
  id: string

  /**
   * User email address
   */
  email: string

  /**
   * Display name
   */
  displayName: string

  /**
   * User role
   */
  role: UserRole

  /**
   * Number of assigned projects
   */
  projectCount?: number
}

/**
 * UserDetailDTO
 *
 * Complete user information for detail views and profiles.
 *
 * **Usage:**
 * - User profile page
 * - User management detail view
 * - Account settings
 */
export interface UserDetailDTO {
  /**
   * Unique user identifier
   */
  id: string

  /**
   * User email address
   */
  email: string

  /**
   * Display name
   */
  displayName: string

  /**
   * User name
   */
  name?: string

  /**
   * Profile photo URL
   */
  photoUrl?: string

  /**
   * User role
   */
  role: UserRole

  /**
   * Array of assigned project IDs
   */
  projects: string[]

  /**
   * Account creation timestamp
   */
  createdAt: Date

  /**
   * Last profile update timestamp
   */
  updatedAt: Date

  /**
   * Last login timestamp
   */
  lastLogin?: Date
}

/**
 * UserSummaryDTO
 *
 * Minimal user information for references and mentions.
 *
 * **Usage:**
 * - Content author display
 * - Activity feed user references
 * - Quick user mentions
 */
export interface UserSummaryDTO {
  /**
   * User ID
   */
  id: string

  /**
   * Display name or email
   */
  displayName: string

  /**
   * User role
   */
  role: UserRole
}

/**
 * CurrentUserDTO
 *
 * Current logged-in user information for authentication context.
 *
 * **Usage:**
 * - Authentication context
 * - Navigation user menu
 * - Permission checks
 */
export interface CurrentUserDTO {
  /**
   * User ID
   */
  id: string

  /**
   * Email address
   */
  email: string

  /**
   * Display name
   */
  displayName: string

  /**
   * User role
   */
  role: UserRole

  /**
   * Assigned projects
   */
  projects: string[]

  /**
   * Photo URL
   */
  photoUrl?: string
}

/**
 * UserMapper
 *
 * Static utility class for mapping User domain entities to DTOs.
 */
export class UserMapper {
  /**
   * Get display name from user entity
   *
   * Falls back to email if no display name is set.
   *
   * @param user - User entity
   * @returns Display name
   */
  private static getDisplayName(user: User): string {
    return user.displayName || user.name || user.email
  }

  /**
   * Convert User entity to UserListDTO
   *
   * @param user - The full user entity
   * @returns Simplified list DTO
   */
  static toListDTO(user: User): UserListDTO {
    return {
      id: user.uid,
      email: user.email,
      displayName: UserMapper.getDisplayName(user),
      role: user.role,
      projectCount: user.projects?.length || 0,
    }
  }

  /**
   * Convert array of User entities to UserListDTO array
   *
   * @param users - Array of user entities
   * @returns Array of list DTOs
   */
  static toListDTOList(users: User[]): UserListDTO[] {
    return users.map((u) => UserMapper.toListDTO(u))
  }

  /**
   * Convert User entity to UserDetailDTO
   *
   * @param user - The full user entity
   * @returns Detailed user DTO
   */
  static toDetailDTO(user: User): UserDetailDTO {
    return {
      id: user.uid,
      email: user.email,
      displayName: UserMapper.getDisplayName(user),
      name: user.name,
      photoUrl: user.photoUrl,
      role: user.role,
      projects: user.projects || [],
      createdAt: user.createdAt || new Date(),
      updatedAt: user.updatedAt || new Date(),
      lastLogin: user.lastLogin,
    }
  }

  /**
   * Convert User entity to UserSummaryDTO
   *
   * @param user - The full user entity
   * @returns Summary DTO
   */
  static toSummaryDTO(user: User): UserSummaryDTO {
    return {
      id: user.uid,
      displayName: UserMapper.getDisplayName(user),
      role: user.role,
    }
  }

  /**
   * Convert User entity to CurrentUserDTO
   *
   * @param user - The full user entity
   * @returns Current user DTO
   */
  static toCurrentUserDTO(user: User): CurrentUserDTO {
    return {
      id: user.uid,
      email: user.email,
      displayName: UserMapper.getDisplayName(user),
      role: user.role,
      projects: user.projects || [],
      photoUrl: user.photoUrl,
    }
  }
}
