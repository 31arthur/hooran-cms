/**
 * useUseCase Hook
 *
 * React hook for resolving use cases from the DI container.
 * Provides type-safe access to use case instances in React components.
 *
 * **Purpose:**
 * - Simplifies dependency resolution in React components
 * - Provides type-safe access to use cases
 * - Maintains separation between UI and business logic
 *
 * **Architecture:**
 * - UI Layer: React components use this hook
 * - DI Layer: Hook resolves from DIContainer
 * - Application Layer: Returns use case instances
 *
 * @example
 * ```tsx
 * import { useUseCase } from '@/presentation/hooks/useUseCase'
 * import { _DI_TYPES } from '@/domain/di'
 * import type { IContentManagementUseCase } from '@/application/usecases'
 *
 * function ContentManager() {
 *   const contentManagementUseCase = useUseCase<IContentManagementUseCase>(
 *     _DI_TYPES.ContentManagementUseCase
 *   )
 *
 *   const fetchEntries = async () => {
 *     const entries = await contentManagementUseCase.getEntries(projectId, collectionId)
 *     // ...
 *   }
 * }
 * ```
 */

import { DIContainer } from '@/domain/di'

/**
 * useUseCase Hook
 *
 * Resolves a use case instance from the DI container.
 *
 * @template T - The type of the use case interface
 * @param symbol - The DI symbol for the use case (from _DI_TYPES)
 * @returns The resolved use case instance
 * @throws {Error} If the use case is not registered in the DI container
 *
 * @example
 * ```tsx
 * const authUseCase = useUseCase<IAuthUseCase>(_DI_TYPES.AuthUseCase)
 * const contentUseCase = useUseCase<IContentManagementUseCase>(_DI_TYPES.ContentManagementUseCase)
 * ```
 */
export function useUseCase<T>(symbol: symbol): T {
  try {
    const useCase = DIContainer.resolve<T>(symbol)

    if (!useCase) {
      throw new Error(
        `Use case not found for symbol: ${symbol.toString()}. ` +
        'Ensure initializeDependencies() was called before rendering the app.'
      )
    }

    return useCase
  } catch (error) {
    console.error('❌ useUseCase: Failed to resolve use case:', error)
    throw new Error(
      `Failed to resolve use case: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
      'Check that the DI container is properly initialized.'
    )
  }
}

/**
 * Export for convenience
 */
export default useUseCase
