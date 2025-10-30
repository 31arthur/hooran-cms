/**
 * Firebase Repository Implementations
 *
 * Concrete implementations of repository interfaces using Firebase Firestore.
 * These are the ONLY classes in the application that directly interact with
 * the Firebase SDK for data operations.
 *
 * **CRITICAL: Framework Independence**
 * These implementations:
 * - Implement repository interfaces from @/domain/repositories
 * - Contain ALL Firebase-specific code
 * - Convert Firebase types to domain entities
 * - Handle Firebase-specific errors
 * - Are completely replaceable without affecting business logic
 *
 * **Repository Pattern Benefits:**
 * - Business logic depends on interfaces, not concrete implementations
 * - Easy to swap Firebase for PostgreSQL, MongoDB, etc.
 * - Easy to mock for unit testing
 * - Clear separation between data access and business logic
 */

export { FirebaseProjectRepository } from './FirebaseProjectRepository'
export { FirebaseSchemaRepository } from './FirebaseSchemaRepository'
export { FirebaseContentRepository } from './FirebaseContentRepository'
