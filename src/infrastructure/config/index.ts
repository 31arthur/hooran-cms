/**
 * Infrastructure Configuration Module
 *
 * This module exports all database initialization interfaces and implementations.
 *
 * **Exports:**
 * - IDatabaseInitializer - Interface for database initialization
 * - FirebaseInitializer - Firebase implementation
 * - MockDatabaseInitializer - Mock implementation for testing
 * - Database configuration types and enums
 */

export type {
  IDatabaseInitializer,
  DatabaseConfig,
  DatabaseHealthCheck,
} from './IDatabaseInitializer'

export { DatabaseStatus, MockDatabaseInitializer } from './IDatabaseInitializer'

export { FirebaseInitializer, type FirebaseConfig } from './FirebaseInitializer'
