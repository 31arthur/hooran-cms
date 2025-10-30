/**
 * Application Use Cases
 *
 * This module exports all use case interfaces that define the application layer
 * contracts. Use cases represent high-level business operations and orchestrate
 * interactions between repositories and domain entities.
 *
 * **Clean Architecture - Application Layer:**
 * Use cases sit between the presentation layer (UI) and the domain/infrastructure layers.
 * They encapsulate application-specific business rules and coordinate the flow of data.
 *
 * **Key Characteristics:**
 * - Accept and return ONLY domain entities or primitives
 * - NO framework-specific types (no Firebase, React, etc.)
 * - Define clear business operation contracts
 * - Orchestrate multiple repository operations
 * - Apply business rules and validation
 * - Handle authorization and access control
 *
 * **Dependency Direction:**
 * ```
 * UI/Presentation Layer
 *         ↓ uses
 * Application Layer (Use Cases) ← YOU ARE HERE
 *         ↓ uses
 * Domain Layer (Entities, Repository Interfaces)
 *         ↑ implements
 * Infrastructure Layer (Repository Implementations)
 * ```
 *
 * **Example Usage:**
 * ```typescript
 * // In UI component
 * import { DIContainer, DI_TYPES } from '@/domain/di'
 * import type { IProjectSelectionUseCase } from '@/application/usecases'
 *
 * const useCase = DIContainer.resolve<IProjectSelectionUseCase>(
 *   DI_TYPES.ProjectSelectionUseCase
 * )
 *
 * const projects = await useCase.getAccessibleProjects(userId, userRole)
 * ```
 */

// Project Selection Use Case
export type {
  IProjectSelectionUseCase,
  ProjectSelectionResult,
  ProjectListItem,
} from './IProjectSelectionUseCase'

// Content Management Use Case
export type {
  IContentManagementUseCase,
  ContentEntryWithSchema,
  ContentListResult,
  ContentValidationResult,
  BatchOperationResult,
} from './IContentManagementUseCase'

// Schema Management Use Case
export type {
  ISchemaManagementUseCase,
  SchemaWithStats,
  SchemaDeletionResult,
} from './ISchemaManagementUseCase'

// User Management Use Case
export type {
  IUserManagementUseCase,
  User,
  UserWithProjects,
  ProjectAssignmentResult,
} from './IUserManagementUseCase'

// Authentication Use Case
export type {
  IAuthUseCase,
  FirebaseUserInfo,
  AuthSessionResult,
  SignInResult,
} from './IAuthUseCase'

// Public Data Retrieval Use Case
export type {
  IPublicDataRetrievalUseCase,
  PublicContentStats,
} from './IPublicDataRetrievalUseCase'

// Audit Retrieval Use Case
export type {
  IAuditRetrievalUseCase,
  CriticalLogResult,
  AuditLogStatistics,
} from './IAuditRetrievalUseCase'

// Settings Management Use Case
export type {
  ISettingsManagementUseCase,
  SystemSettings,
  ProjectCreationResult,
} from './ISettingsManagementUseCase'

// Dashboard Data Use Case
export type { IDashboardDataUseCase } from './IDashboardDataUseCase'
