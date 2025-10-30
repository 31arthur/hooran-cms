/**
 * Mock Content Repository
 *
 * In-memory implementation of IContentRepository for testing purposes.
 * This mock allows unit tests to run without Firebase dependencies.
 */

import type { IContentRepository } from '@/domain/repositories'
import type {
  ContentEntry,
  CreateContentEntryInput,
  UpdateContentEntryInput,
  GetContentEntriesOptions,
} from '@/domain/entities'

/**
 * MockContentRepository
 *
 * In-memory implementation for testing
 */
export class MockContentRepository implements IContentRepository {
  private entries: Map<string, Map<string, ContentEntry>> = new Map()
  private idCounter = 1

  constructor(
    initialEntries: Array<{ projectId: string; collectionId: string; entry: ContentEntry }> = []
  ) {
    initialEntries.forEach(({ projectId, collectionId, entry }) => {
      const key = `${projectId}:${collectionId}`
      if (!this.entries.has(key)) {
        this.entries.set(key, new Map())
      }
      this.entries.get(key)!.set(entry.id, entry)
    })
  }

  private getKey(projectId: string, collectionId: string): string {
    return `${projectId}:${collectionId}`
  }

  async getContentEntries(
    projectId: string,
    collectionId: string,
    options: GetContentEntriesOptions
  ): Promise<ContentEntry[]> {
    const key = this.getKey(projectId, collectionId)
    const collectionEntries = this.entries.get(key)

    if (!collectionEntries) {
      return []
    }

    let entries = Array.from(collectionEntries.values())

    // Apply filters
    if (options.filterField && options.filterValue !== undefined) {
      entries = entries.filter((entry) => {
        if (options.filterField === 'status') {
          return entry.status === options.filterValue
        }
        const value = entry.data[options.filterField!]
        return value === options.filterValue
      })
    }

    // Apply search
    if (options.search && options.search.trim() !== '') {
      const searchTerm = options.search.trim().toLowerCase()
      entries = entries.filter((entry) => {
        const title = entry.data.title || ''
        return title.toLowerCase().includes(searchTerm)
      })
    }

    // Apply limit
    entries = entries.slice(0, options.limit)

    return entries
  }

  async getContentEntryById(
    projectId: string,
    collectionId: string,
    entryId: string
  ): Promise<ContentEntry | null> {
    const key = this.getKey(projectId, collectionId)
    const collectionEntries = this.entries.get(key)

    if (!collectionEntries) {
      return null
    }

    return collectionEntries.get(entryId) || null
  }

  async createContentEntry(
    projectId: string,
    collectionId: string,
    entryData: CreateContentEntryInput,
    userId: string
  ): Promise<string> {
    const key = this.getKey(projectId, collectionId)
    const entryId = `entry-${this.idCounter++}`

    const newEntry: ContentEntry = {
      id: entryId,
      projectId,
      collectionId,
      data: entryData.data,
      status: entryData.status || 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
    }

    if (!this.entries.has(key)) {
      this.entries.set(key, new Map())
    }
    this.entries.get(key)!.set(entryId, newEntry)

    return entryId
  }

  async updateContentEntry(
    projectId: string,
    collectionId: string,
    entryId: string,
    updates: UpdateContentEntryInput,
    userId: string
  ): Promise<void> {
    const entry = await this.getContentEntryById(projectId, collectionId, entryId)
    if (!entry) {
      throw new Error(`Entry "${entryId}" not found in collection "${collectionId}"`)
    }

    const updatedEntry: ContentEntry = {
      ...entry,
      ...(updates.data && { data: updates.data }),
      ...(updates.status && { status: updates.status }),
      updatedAt: new Date(),
      updatedBy: userId,
    }

    const key = this.getKey(projectId, collectionId)
    this.entries.get(key)!.set(entryId, updatedEntry)
  }

  async deleteContentEntry(
    projectId: string,
    collectionId: string,
    entryId: string,
    _userId: string
  ): Promise<void> {
    const entry = await this.getContentEntryById(projectId, collectionId, entryId)
    if (!entry) {
      throw new Error(`Entry "${entryId}" not found in collection "${collectionId}"`)
    }

    const key = this.getKey(projectId, collectionId)
    const collectionEntries = this.entries.get(key)
    if (collectionEntries) {
      collectionEntries.delete(entryId)
    }
  }

  async batchUpdateContentStatus(
    projectId: string,
    collectionId: string,
    contentIds: string[],
    status: 'published' | 'draft',
    userId: string
  ): Promise<void> {
    for (const entryId of contentIds) {
      try {
        await this.updateContentEntry(
          projectId,
          collectionId,
          entryId,
          { status },
          userId
        )
      } catch (error) {
        // Continue with other entries even if one fails
        console.warn(`Failed to update entry ${entryId}:`, error)
      }
    }
  }

  async getPublishedContentByCollection(
    projectId: string,
    collectionId: string,
    limit: number = 50
  ): Promise<ContentEntry[]> {
    const key = this.getKey(projectId, collectionId)
    const collectionEntries = this.entries.get(key)

    if (!collectionEntries) {
      return []
    }

    const publishedEntries = Array.from(collectionEntries.values()).filter(
      (entry) => entry.status === 'published'
    )

    return publishedEntries.slice(0, limit)
  }

  async countContentEntries(
    projectId: string,
    collectionId: string,
    status?: 'draft' | 'published' | 'archived'
  ): Promise<number> {
    const key = this.getKey(projectId, collectionId)
    const collectionEntries = this.entries.get(key)

    if (!collectionEntries) {
      return 0
    }

    if (!status) {
      return collectionEntries.size
    }

    const filteredEntries = Array.from(collectionEntries.values()).filter(
      (entry) => entry.status === status
    )

    return filteredEntries.length
  }

  // Test helper methods
  clear(): void {
    this.entries.clear()
    this.idCounter = 1
  }

  addEntry(projectId: string, collectionId: string, entry: ContentEntry): void {
    const key = this.getKey(projectId, collectionId)
    if (!this.entries.has(key)) {
      this.entries.set(key, new Map())
    }
    this.entries.get(key)!.set(entry.id, entry)
  }

  getEntryCount(projectId: string, collectionId: string): number {
    const key = this.getKey(projectId, collectionId)
    const collectionEntries = this.entries.get(key)
    return collectionEntries ? collectionEntries.size : 0
  }
}
