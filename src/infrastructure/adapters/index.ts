/**
 * Data Adapters
 *
 * Adapters handle conversion between Firebase Firestore data structures
 * and clean domain entities. This is the ONLY place where Firebase-specific
 * types are converted to/from domain entities.
 *
 * **Framework Independence:**
 * By isolating type conversions in adapters, we ensure:
 * - Domain entities remain database-agnostic
 * - Business logic never touches Firebase types
 * - Database migration becomes straightforward
 */

export { ProjectAdapter } from './ProjectAdapter'
export { SchemaAdapter } from './SchemaAdapter'
export { ContentAdapter } from './ContentAdapter'
