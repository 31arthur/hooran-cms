/**
 * Dependency Injection Module
 *
 * This module provides a lightweight, type-safe dependency injection system
 * for the application. It includes:
 * - DIContainer: Singleton container for managing dependencies
 * - DI_TYPES: Symbol-based tokens for type-safe dependency registration
 *
 * **Quick Start:**
 * ```typescript
 * import { DIContainer, DI_TYPES } from '@/domain/di'
 * import type { IProjectRepository } from '@/domain/repositories'
 *
 * // Register a dependency
 * DIContainer.register<IProjectRepository>(
 *   DI_TYPES.ProjectRepository,
 *   new FirebaseProjectRepository()
 * )
 *
 * // Resolve a dependency
 * const projectRepo = DIContainer.resolve<IProjectRepository>(
 *   DI_TYPES.ProjectRepository
 * )
 * ```
 *
 * **Testing:**
 * ```typescript
 * import { DIContainer, DI_TYPES } from '@/domain/di'
 *
 * beforeEach(() => {
 *   DIContainer.clear()
 *   DIContainer.register(DI_TYPES.ProjectRepository, mockProjectRepo)
 * })
 * ```
 */

export { DIContainer, DependencyInjectionContainer } from './DIContainer'
export { DI_TYPES } from './diTypes'
export type { DIToken, DITypeMap } from './diTypes'
