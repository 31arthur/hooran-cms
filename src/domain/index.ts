/**
 * Core Domain Layer
 *
 * This module serves as the main entry point for the core domain layer,
 * which includes:
 * - Domain entities (clean, database-agnostic data models)
 * - Repository interfaces (contracts for data access)
 * - Dependency injection system (for testability and loose coupling)
 *
 * **Framework Independence Principle:**
 * Everything exported from this module is completely free from any
 * database or framework-specific dependencies. This enables:
 * - Easy unit testing with mocks
 * - Database migration without changing business logic
 * - Clear separation of concerns
 * - Dependency inversion (business logic depends on interfaces, not implementations)
 */

// Re-export all entities
export * from './entities'

// Re-export all repository interfaces
export * from './repositories'

// Re-export dependency injection system
export * from './di'
