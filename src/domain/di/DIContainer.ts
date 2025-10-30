/**
 * Dependency Injection Container
 *
 * A lightweight, type-safe dependency injection container for managing
 * application dependencies and enabling testability.
 *
 * **Key Features:**
 * - Singleton pattern for global access
 * - Type-safe registration and resolution
 * - Symbol-based tokens (no magic strings)
 * - Clear error messages for missing dependencies
 * - Easy mocking for unit tests
 *
 * **Design Principles:**
 * - Dependency Inversion: High-level modules depend on abstractions (interfaces)
 * - Single Responsibility: Container only manages dependency lifecycle
 * - Open/Closed: Easy to extend with new dependencies
 *
 * **Usage:**
 * ```typescript
 * import { DIContainer } from '@/domain/di'
 * import { DI_TYPES } from '@/domain/di/diTypes'
 *
 * // Register a dependency
 * DIContainer.register<IProjectRepository>(
 *   DI_TYPES.ProjectRepository,
 *   new FirebaseProjectRepository()
 * )
 *
 * // Resolve a dependency
 * const repo = DIContainer.resolve<IProjectRepository>(DI_TYPES.ProjectRepository)
 *
 * // Check if registered
 * if (DIContainer.isRegistered(DI_TYPES.ProjectRepository)) {
 *   // Use it
 * }
 *
 * // Clear for testing
 * DIContainer.clear()
 * ```
 */

/**
 * Dependency Injection Container Class
 *
 * Manages registration and resolution of dependencies throughout the application.
 */
class DependencyInjectionContainer {
  /**
   * Internal registry storing all registered dependencies
   * Key: Symbol (injection token)
   * Value: Instance of the registered type
   */
  private registry: Map<symbol, any> = new Map()

  /**
   * Singleton instance
   */
  private static instance: DependencyInjectionContainer

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Initialize empty registry
    this.registry = new Map()
  }

  /**
   * Get the singleton instance of the container
   *
   * @returns {DependencyInjectionContainer} The singleton instance
   */
  public static getInstance(): DependencyInjectionContainer {
    if (!DependencyInjectionContainer.instance) {
      DependencyInjectionContainer.instance = new DependencyInjectionContainer()
    }
    return DependencyInjectionContainer.instance
  }

  /**
   * Register a dependency in the container
   *
   * Registers an implementation for a given symbol token. If a dependency
   * with the same token already exists, it will be replaced.
   *
   * @template T - The type of the dependency
   * @param {symbol} token - The unique symbol identifier for this dependency
   * @param {T} instance - The instance to register
   *
   * @example
   * ```typescript
   * DIContainer.register<IProjectRepository>(
   *   DI_TYPES.ProjectRepository,
   *   new FirebaseProjectRepository()
   * )
   * ```
   */
  public register<T>(token: symbol, instance: T): void {
    if (typeof token !== 'symbol') {
      throw new Error(
        'DIContainer.register: Token must be a symbol. Use Symbol.for() or symbols from DI_TYPES.'
      )
    }

    if (instance === undefined || instance === null) {
      throw new Error(
        `DIContainer.register: Cannot register null or undefined instance for token "${token.toString()}"`
      )
    }

    // Check if already registered (warn but allow override)
    if (this.registry.has(token)) {
      console.warn(
        `DIContainer: Overriding existing registration for token "${token.toString()}". This may indicate a configuration issue.`
      )
    }

    this.registry.set(token, instance)
    console.log(`✅ DIContainer: Registered dependency for token "${token.toString()}"`)
  }

  /**
   * Resolve a dependency from the container
   *
   * Retrieves the registered implementation for a given symbol token.
   * Throws an error if the dependency is not registered.
   *
   * @template T - The type of the dependency
   * @param {symbol} token - The unique symbol identifier
   * @returns {T} The registered instance
   * @throws {Error} If the dependency is not registered
   *
   * @example
   * ```typescript
   * const repo = DIContainer.resolve<IProjectRepository>(DI_TYPES.ProjectRepository)
   * const projects = await repo.getProjects()
   * ```
   */
  public resolve<T>(token: symbol): T {
    if (typeof token !== 'symbol') {
      throw new Error(
        'DIContainer.resolve: Token must be a symbol. Use Symbol.for() or symbols from DI_TYPES.'
      )
    }

    if (!this.registry.has(token)) {
      throw new Error(
        `DIContainer.resolve: No dependency registered for token "${token.toString()}". ` +
          `Did you forget to call DIContainer.register() for this dependency? ` +
          `Make sure the container is initialized before resolving dependencies.`
      )
    }

    const instance = this.registry.get(token) as T
    return instance
  }

  /**
   * Check if a dependency is registered
   *
   * @param {symbol} token - The unique symbol identifier
   * @returns {boolean} True if the dependency is registered
   *
   * @example
   * ```typescript
   * if (DIContainer.isRegistered(DI_TYPES.ProjectRepository)) {
   *   console.log('ProjectRepository is available')
   * }
   * ```
   */
  public isRegistered(token: symbol): boolean {
    if (typeof token !== 'symbol') {
      throw new Error('DIContainer.isRegistered: Token must be a symbol.')
    }
    return this.registry.has(token)
  }

  /**
   * Unregister a dependency
   *
   * Removes a dependency from the container. Useful for testing or
   * when you need to replace a dependency at runtime.
   *
   * @param {symbol} token - The unique symbol identifier
   * @returns {boolean} True if the dependency was unregistered, false if it wasn't registered
   *
   * @example
   * ```typescript
   * DIContainer.unregister(DI_TYPES.ProjectRepository)
   * ```
   */
  public unregister(token: symbol): boolean {
    if (typeof token !== 'symbol') {
      throw new Error('DIContainer.unregister: Token must be a symbol.')
    }

    if (this.registry.has(token)) {
      this.registry.delete(token)
      console.log(`✅ DIContainer: Unregistered dependency for token "${token.toString()}"`)
      return true
    }

    console.warn(`⚠️ DIContainer: Attempted to unregister non-existent token "${token.toString()}"`)
    return false
  }

  /**
   * Clear all registered dependencies
   *
   * Removes all dependencies from the container. Primarily useful for testing
   * to ensure a clean state between test cases.
   *
   * @example
   * ```typescript
   * // In test setup
   * beforeEach(() => {
   *   DIContainer.clear()
   *   // Register mock dependencies
   *   DIContainer.register(DI_TYPES.ProjectRepository, mockProjectRepo)
   * })
   * ```
   */
  public clear(): void {
    const count = this.registry.size
    this.registry.clear()
    console.log(`✅ DIContainer: Cleared ${count} registered dependencies`)
  }

  /**
   * Get all registered tokens
   *
   * Returns an array of all registered symbol tokens.
   * Useful for debugging and introspection.
   *
   * @returns {symbol[]} Array of registered tokens
   *
   * @example
   * ```typescript
   * const tokens = DIContainer.getRegisteredTokens()
   * console.log(`Registered dependencies: ${tokens.length}`)
   * ```
   */
  public getRegisteredTokens(): symbol[] {
    return Array.from(this.registry.keys())
  }

  /**
   * Get the number of registered dependencies
   *
   * @returns {number} Count of registered dependencies
   */
  public count(): number {
    return this.registry.size
  }

  /**
   * Register multiple dependencies at once
   *
   * Convenience method for bulk registration of dependencies.
   *
   * @param {Array<[symbol, any]>} entries - Array of [token, instance] tuples
   *
   * @example
   * ```typescript
   * DIContainer.registerMany([
   *   [DI_TYPES.ProjectRepository, new FirebaseProjectRepository()],
   *   [DI_TYPES.SchemaRepository, new FirebaseSchemaRepository()],
   *   [DI_TYPES.ContentRepository, new FirebaseContentRepository()],
   * ])
   * ```
   */
  public registerMany(entries: Array<[symbol, any]>): void {
    for (const [token, instance] of entries) {
      this.register(token, instance)
    }
  }

  /**
   * Try to resolve a dependency, returning null if not found
   *
   * Non-throwing version of resolve(). Useful when a dependency is optional.
   *
   * @template T - The type of the dependency
   * @param {symbol} token - The unique symbol identifier
   * @returns {T | null} The registered instance or null if not found
   *
   * @example
   * ```typescript
   * const repo = DIContainer.tryResolve<IProjectRepository>(DI_TYPES.ProjectRepository)
   * if (repo) {
   *   // Use repo
   * } else {
   *   // Handle missing dependency
   * }
   * ```
   */
  public tryResolve<T>(token: symbol): T | null {
    if (typeof token !== 'symbol') {
      throw new Error('DIContainer.tryResolve: Token must be a symbol.')
    }

    if (!this.registry.has(token)) {
      return null
    }

    return this.registry.get(token) as T
  }
}

/**
 * Singleton instance of the DI container
 *
 * This is the primary export that should be used throughout the application.
 *
 * @example
 * ```typescript
 * import { DIContainer } from '@/domain/di'
 * import { DI_TYPES } from '@/domain/di/diTypes'
 *
 * // Register dependencies
 * DIContainer.register(DI_TYPES.ProjectRepository, new FirebaseProjectRepository())
 *
 * // Resolve dependencies
 * const repo = DIContainer.resolve<IProjectRepository>(DI_TYPES.ProjectRepository)
 * ```
 */
export const DIContainer = DependencyInjectionContainer.getInstance()

/**
 * Export the class for advanced usage and testing
 */
export { DependencyInjectionContainer }
