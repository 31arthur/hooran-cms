/**
 * Mock Repository Implementations
 *
 * In-memory implementations of repository interfaces for testing purposes.
 * These mocks allow unit tests to run without Firebase dependencies.
 *
 * **Usage:**
 * ```typescript
 * import { DIContainer, DI_TYPES } from '@/domain/di'
 * import { MockProjectRepository } from '@/infrastructure/repositories/__mocks__'
 *
 * beforeEach(() => {
 *   DIContainer.clear()
 *   DIContainer.register(DI_TYPES.ProjectRepository, new MockProjectRepository())
 * })
 * ```
 */

export { MockProjectRepository } from './MockProjectRepository'
export { MockSchemaRepository } from './MockSchemaRepository'
export { MockContentRepository } from './MockContentRepository'
