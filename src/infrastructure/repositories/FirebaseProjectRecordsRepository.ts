/**
 * Firebase Project Records Repository Implementation
 *
 * Implements IProjectRecordsRepository using Firebase Firestore.
 * Stores each table as an individual document in the tables subcollection.
 *
 * **Collection Structure:**
 * projects/
 *   {projectId}/
 *     tables/
 *       {schemaId}/              ← Individual document per table
 *         - projectId: string
 *         - schemaId: string
 *         - collectionName: string
 *         - collectionSlug: string
 *         - description: string
 *         - icon: string
 *         - entryCount: number
 *         - isActive: boolean
 *         - createdAt: Timestamp
 *         - updatedAt: Timestamp
 *         - createdBy: string
 *         - updatedBy: string
 *
 * **Design:**
 *  - Each table has its own document named after the schemaId
 *  - Easy to query individual tables
 *  - Supports efficient CRUD operations per table
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { IProjectRecordsRepository } from '@/domain/repositories/IProjectRecordsRepository'
import type {
  ProjectRecords,
  CreateProjectRecordsInput,
  AddCollectionToProjectInput,
  RemoveCollectionFromProjectInput,
  UpdateCollectionReferenceInput,
  CollectionReference,
} from '@/domain/entities/ProjectRecords'

export class FirebaseProjectRecordsRepository implements IProjectRecordsRepository {
  private readonly collectionName = 'projects'
  private readonly subCollectionName = 'tables'

  /**
   * Get reference to a specific table document
   */
  private getTableDocRef(projectId: string, schemaId: string) {
    return doc(db, this.collectionName, projectId, this.subCollectionName, schemaId)
  }

  /**
   * Get collection reference for all tables in a project
   */
  private getTablesCollectionRef(projectId: string) {
    return collection(db, this.collectionName, projectId, this.subCollectionName)
  }

  /**
   * Create project records document (legacy method for compatibility)
   * Note: This now creates individual documents for each collection
   */
  async createProjectRecords(input: CreateProjectRecordsInput): Promise<ProjectRecords> {
    try {
      const now = new Date()

      // Create individual documents for each collection
      for (const collectionRef of input.collections || []) {
        const tableDocRef = this.getTableDocRef(input.projectId, collectionRef.schemaId)

        const tableData = {
          projectId: input.projectId,
          schemaId: collectionRef.schemaId,
          collectionName: collectionRef.collectionName,
          collectionSlug: collectionRef.collectionSlug,
          description: collectionRef.description || '',
          icon: collectionRef.icon || '',
          entryCount: collectionRef.entryCount || 0,
          isActive: collectionRef.isActive !== undefined ? collectionRef.isActive : true,
          createdAt: Timestamp.fromDate(collectionRef.addedAt || now),
          updatedAt: Timestamp.fromDate(now),
          createdBy: collectionRef.addedBy || input.createdBy,
          updatedBy: input.createdBy,
        }

        await setDoc(tableDocRef, tableData)
      }

      console.log(`✅ FirebaseProjectRecordsRepository: Created ${input.collections?.length || 0} table documents for project ${input.projectId}`)

      return {
        projectId: input.projectId,
        collections: input.collections || [],
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
        updatedBy: input.createdBy,
      }
    } catch (error: any) {
      console.error('❌ FirebaseProjectRecordsRepository: Failed to create project records', error)
      throw new Error(`Failed to create project records: ${error.message}`)
    }
  }

  /**
   * Get project records by project ID
   * Fetches all table documents and aggregates them
   */
  async getProjectRecords(projectId: string): Promise<ProjectRecords | null> {
    try {
      const collections = await this.getCollectionsForProject(projectId)

      if (collections.length === 0) {
        return null
      }

      // Get metadata from first collection or use defaults
      const firstCollection = collections[0]

      return {
        projectId,
        collections,
        createdAt: firstCollection.addedAt,
        updatedAt: firstCollection.addedAt,
        createdBy: firstCollection.addedBy,
        updatedBy: firstCollection.addedBy,
      }
    } catch (error: any) {
      console.error('❌ FirebaseProjectRecordsRepository: Failed to get project records', error)
      throw new Error(`Failed to get project records: ${error.message}`)
    }
  }

  /**
   * Add collection to project
   * Creates a new document named after the schemaId
   */
  async addCollectionToProject(input: AddCollectionToProjectInput): Promise<CollectionReference> {
    try {
      const tableDocRef = this.getTableDocRef(input.projectId, input.schemaId)
      const now = new Date()

      const collectionRef: CollectionReference = {
        schemaId: input.schemaId,
        collectionName: input.collectionName,
        collectionSlug: input.collectionSlug,
        description: input.description || '',
        icon: input.icon || '',
        entryCount: 0,
        addedAt: now,
        addedBy: input.addedBy,
        isActive: true,
      }

      const tableData = {
        projectId: input.projectId,
        schemaId: input.schemaId,
        collectionName: input.collectionName,
        collectionSlug: input.collectionSlug,
        description: input.description || '',
        icon: input.icon || '',
        entryCount: 0,
        isActive: true,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
        createdBy: input.addedBy,
        updatedBy: input.addedBy,
      }

      await setDoc(tableDocRef, tableData)

      console.log(
        `✅ FirebaseProjectRecordsRepository: Created table document ${input.schemaId} for project ${input.projectId}`
      )

      return collectionRef
    } catch (error: any) {
      console.error('❌ FirebaseProjectRecordsRepository: Failed to add collection to project', error)
      throw new Error(`Failed to add collection to project: ${error.message}`)
    }
  }

  /**
   * Remove collection from project
   * Deletes the document named after the schemaId
   */
  async removeCollectionFromProject(input: RemoveCollectionFromProjectInput): Promise<void> {
    try {
      const tableDocRef = this.getTableDocRef(input.projectId, input.schemaId)

      // Check if document exists
      const docSnap = await getDoc(tableDocRef)
      if (!docSnap.exists()) {
        throw new Error(`Table document ${input.schemaId} not found in project ${input.projectId}`)
      }

      // Delete the document
      await deleteDoc(tableDocRef)

      console.log(
        `✅ FirebaseProjectRecordsRepository: Deleted table document ${input.schemaId} from project ${input.projectId}`
      )
    } catch (error: any) {
      console.error(
        '❌ FirebaseProjectRecordsRepository: Failed to remove collection from project',
        error
      )
      throw new Error(`Failed to remove collection from project: ${error.message}`)
    }
  }

  /**
   * Update collection reference
   * Updates the document named after the schemaId
   */
  async updateCollectionReference(
    input: UpdateCollectionReferenceInput
  ): Promise<CollectionReference> {
    try {
      const tableDocRef = this.getTableDocRef(input.projectId, input.schemaId)

      // Check if document exists
      const docSnap = await getDoc(tableDocRef)
      if (!docSnap.exists()) {
        throw new Error(`Table document ${input.schemaId} not found in project ${input.projectId}`)
      }

      const now = new Date()
      const updateData: any = {
        ...input.updates,
        updatedAt: Timestamp.fromDate(now),
        updatedBy: input.updatedBy,
      }

      await updateDoc(tableDocRef, updateData)

      console.log(
        `✅ FirebaseProjectRecordsRepository: Updated table document ${input.schemaId} in project ${input.projectId}`
      )

      // Return updated collection reference
      const updatedDoc = await getDoc(tableDocRef)
      return this.convertDocToCollectionRef(updatedDoc.data()!)
    } catch (error: any) {
      console.error('❌ FirebaseProjectRecordsRepository: Failed to update collection reference', error)
      throw new Error(`Failed to update collection reference: ${error.message}`)
    }
  }

  /**
   * Get all collections for a project
   * Queries all documents in the tables subcollection
   */
  async getCollectionsForProject(projectId: string): Promise<CollectionReference[]> {
    try {
      const tablesCollectionRef = this.getTablesCollectionRef(projectId)
      const querySnapshot = await getDocs(tablesCollectionRef)

      const collections: CollectionReference[] = []
      querySnapshot.forEach((doc) => {
        const collectionRef = this.convertDocToCollectionRef(doc.data())
        collections.push(collectionRef)
      })

      return collections
    } catch (error: any) {
      console.error('❌ FirebaseProjectRecordsRepository: Failed to get collections for project', error)
      throw new Error(`Failed to get collections for project: ${error.message}`)
    }
  }

  /**
   * Check if collection exists in project
   */
  async collectionExistsInProject(projectId: string, schemaId: string): Promise<boolean> {
    try {
      const tableDocRef = this.getTableDocRef(projectId, schemaId)
      const docSnap = await getDoc(tableDocRef)
      return docSnap.exists()
    } catch (error: any) {
      console.error('❌ FirebaseProjectRecordsRepository: Failed to check collection existence', error)
      return false
    }
  }

  /**
   * Get collection reference by schema ID
   */
  async getCollectionReference(
    projectId: string,
    schemaId: string
  ): Promise<CollectionReference | null> {
    try {
      const tableDocRef = this.getTableDocRef(projectId, schemaId)
      const docSnap = await getDoc(tableDocRef)

      if (!docSnap.exists()) {
        return null
      }

      return this.convertDocToCollectionRef(docSnap.data())
    } catch (error: any) {
      console.error('❌ FirebaseProjectRecordsRepository: Failed to get collection reference', error)
      throw new Error(`Failed to get collection reference: ${error.message}`)
    }
  }

  /**
   * Update entry count for a collection
   */
  async updateEntryCount(projectId: string, schemaId: string, count: number): Promise<void> {
    try {
      const tableDocRef = this.getTableDocRef(projectId, schemaId)

      const now = new Date()
      await updateDoc(tableDocRef, {
        entryCount: count,
        updatedAt: Timestamp.fromDate(now),
      })

      console.log(
        `✅ FirebaseProjectRecordsRepository: Updated entry count for table ${schemaId} in project ${projectId}`
      )
    } catch (error: any) {
      console.error('❌ FirebaseProjectRecordsRepository: Failed to update entry count', error)
      throw new Error(`Failed to update entry count: ${error.message}`)
    }
  }

  /**
   * Convert Firestore document data to CollectionReference
   */
  private convertDocToCollectionRef(data: any): CollectionReference {
    return {
      schemaId: data.schemaId,
      collectionName: data.collectionName,
      collectionSlug: data.collectionSlug,
      description: data.description || '',
      icon: data.icon || '',
      entryCount: data.entryCount || 0,
      addedAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      addedBy: data.createdBy,
      isActive: data.isActive !== undefined ? data.isActive : true,
    }
  }
}
