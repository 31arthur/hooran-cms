/**
 * Application Layer
 *
 * The application layer contains use cases (also known as interactors) that
 * define high-level business operations. This layer orchestrates the flow of
 * data between the presentation layer and the domain/infrastructure layers.
 *
 * **Clean Architecture Principle:**
 * The application layer depends on the domain layer (entities and repository interfaces)
 * but is completely independent of:
 * - UI frameworks (React, Vue, Angular, etc.)
 * - Databases (Firebase, PostgreSQL, MongoDB, etc.)
 * - External services
 * - Delivery mechanisms
 *
 * **Layer Responsibilities:**
 * 1. **Use Cases/Interactors** - High-level business operations
 * 2. **Application Services** - Coordinate use cases
 * 3. **DTOs** - Data transfer objects (if needed)
 * 4. **Workflows** - Complex business processes
 *
 * **Architecture Diagram:**
 * ```
 * ┌──────────────────────────────────────────┐
 * │   Presentation Layer (UI)                │
 * │   - React Components                     │
 * │   - View Models                          │
 * └────────────────┬─────────────────────────┘
 *                  │ uses
 *                  ▼
 * ┌──────────────────────────────────────────┐
 * │   Application Layer ← YOU ARE HERE       │
 * │   - Use Cases (IProjectSelectionUseCase) │
 * │   - Business Workflows                   │
 * │   - Authorization Logic                  │
 * └────────────────┬─────────────────────────┘
 *                  │ uses
 *                  ▼
 * ┌──────────────────────────────────────────┐
 * │   Domain Layer                           │
 * │   - Entities (Project, Content)          │
 * │   - Repository Interfaces                │
 * │   - Business Rules                       │
 * └────────────────▲─────────────────────────┘
 *                  │ implements
 *                  │
 * ┌────────────────┴─────────────────────────┐
 * │   Infrastructure Layer                   │
 * │   - Firebase Repositories                │
 * │   - External Services                    │
 * │   - Data Adapters                        │
 * └──────────────────────────────────────────┘
 * ```
 *
 * **Benefits:**
 * - Business logic independent of UI and database
 * - Easy to test (mock repositories)
 * - Clear separation of concerns
 * - Easy to change UI or database without affecting business logic
 * - Reusable across different delivery mechanisms (web, mobile, API)
 */

// Export all use case interfaces
export * from './usecases'
