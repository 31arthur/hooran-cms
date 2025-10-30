/**
 * Project Records Repository Interface
 *
 * Defines the contract for managing project-collection associations.
 * Follows Clean Architecture - this is a domain-layer abstraction.
 *
 * **Framework Independence:**
 * All methods use domain entities (ProjectRecords, CollectionReference) - no Firebase types!
 *
 * **Implementation:**
 * Implemented by FirebaseProjectRecordsRepository in infrastructure layer.
 */

import type {
  ProjectRecords,
  CreateProjectRecordsInput,
  AddCollectionToProjectInput,
  RemoveCollectionFromProjectInput,
  UpdateCollectionReferenceInput,
  CollectionReference,
} from '../entities/ProjectRecords'

export interface IProjectRecordsRepository {
  /**
   * Create project records document
   *
   * @param input - Project records data
   * @returns Promise<ProjectRecords> - Created project records
   */
  createProjectRecords(input: CreateProjectRecordsInput): Promise<ProjectRecords>

  /**
   * Get project records by project ID
   *
   * @param projectId - Project ID
   * @returns Promise<ProjectRecords | null> - Project records or null
   */
  getProjectRecords(projectId: string): Promise<ProjectRecords | null>

  /**
   * Add collection to project
   *
   * @param input - Collection reference data
   * @returns Promise<CollectionReference> - Added collection reference
   */
  addCollectionToProject(input: AddCollectionToProjectInput): Promise<CollectionReference>

  /**
   * Remove collection from project
   *
   * @param input - Collection removal data
   * @returns Promise<void>
   */
  removeCollectionFromProject(input: RemoveCollectionFromProjectInput): Promise<void>

  /**
   * Update collection reference
   *
   * @param input - Collection update data
   * @returns Promise<CollectionReference> - Updated collection reference
   */
  updateCollectionReference(input: UpdateCollectionReferenceInput): Promise<CollectionReference>

  /**
   * Get all collections for a project
   *
   * @param projectId - Project ID
   * @returns Promise<CollectionReference[]> - Collection references
   */
  getCollectionsForProject(projectId: string): Promise<CollectionReference[]>

  /**
   * Check if collection exists in project
   *
   * @param projectId - Project ID
   * @param schemaId - Schema ID
   * @returns Promise<boolean> - True if exists
   */
  collectionExistsInProject(projectId: string, schemaId: string): Promise<boolean>

  /**
   * Get collection reference by schema ID
   *
   * @param projectId - Project ID
   * @param schemaId - Schema ID
   * @returns Promise<CollectionReference | null> - Collection reference or null
   */
  getCollectionReference(projectId: string, schemaId: string): Promise<CollectionReference | null>

  /**
   * Update entry count for a collection
   *
   * @param projectId - Project ID
   * @param schemaId - Schema ID
   * @param count - New entry count
   * @returns Promise<void>
   */
  updateEntryCount(projectId: string, schemaId: string, count: number): Promise<void>
}
