/**
 * Infrastructure Layer
 *
 * The infrastructure layer contains all external dependencies and implementation details:
 * - Repository implementations (Firebase, PostgreSQL, MongoDB, etc.)
 * - Data adapters (type conversions between database and domain entities)
 * - External service integrations
 * - Framework-specific code
 *
 * **Architecture Principle:**
 * The infrastructure layer depends on the core domain layer (via interfaces),
 * but the core domain layer does NOT depend on infrastructure.
 * This enables framework independence and easy testing.
 *
 * ```
 * ┌─────────────────────────────┐
 * │   Core Domain Layer         │
 * │   - Entities                │
 * │   - Repository Interfaces   │
 * │   - DI Container            │
 * └──────────────┬──────────────┘
 *                ▲
 *                │ implements
 *                │
 * ┌──────────────┴──────────────┐
 * │   Infrastructure Layer      │
 * │   - Firebase Repositories   │
 * │   - Data Adapters           │
 * │   - External Services       │
 * └─────────────────────────────┘
 * ```
 */

// Repository implementations
export * from './repositories'

// Data adapters
export * from './adapters'
