/**
 * Core DTOs (Data Transfer Objects)
 *
 * This module exports all DTO interfaces and mappers for the application.
 * DTOs provide simplified views of domain entities for specific UI needs,
 * following the Interface Segregation Principle (ISP).
 *
 * **Architecture Benefits:**
 * - **Decoupling:** UI components don't depend on complex domain entities
 * - **Performance:** Reduced data transfer with only necessary fields
 * - **Security:** Sensitive data can be excluded from DTOs
 * - **Clarity:** Clear contracts between layers
 * - **Evolution:** DTOs can evolve independently of entities
 *
 * **Usage Pattern:**
 * ```typescript
 * // In Use Case:
 * import { ContentMapper, ContentListDTO } from '@/domain/dtos'
 *
 * async getContentList(): Promise<ContentListDTO[]> {
 *   const entities = await this.contentRepository.getContentEntries(...)
 *   return ContentMapper.toListDTOList(entities)
 * }
 *
 * // In UI Component:
 * import type { ContentListDTO } from '@/domain/dtos'
 *
 * function ContentList() {
 *   const [contents, setContents] = useState<ContentListDTO[]>([])
 *   // Component only sees simplified data structure
 * }
 * ```
 *
 * **Design Principles:**
 * 1. **Single Responsibility:** Each DTO serves one specific UI purpose
 * 2. **Interface Segregation:** Components get only the data they need
 * 3. **Dependency Inversion:** UI depends on DTOs, not domain entities
 * 4. **Open/Closed:** Easy to add new DTOs without changing existing ones
 */

// ============================================================================
// PROJECT DTOs
// ============================================================================

export type { ProjectMetadataDTO, ProjectDetailDTO } from './ProjectDTO'
export { ProjectMapper } from './ProjectDTO'

// ============================================================================
// CONTENT DTOs
// ============================================================================

export type {
  ContentListDTO,
  ContentDetailDTO,
  ContentSummaryDTO,
} from './ContentDTO'
export { ContentMapper } from './ContentDTO'

// ============================================================================
// AUDIT DTOs
// ============================================================================

export type {
  AuditSummaryDTO,
  AuditDetailDTO,
  AuditStatisticsDTO,
} from './AuditDTO'
export { AuditMapper } from './AuditDTO'

// ============================================================================
// USER DTOs
// ============================================================================

export type {
  UserListDTO,
  UserDetailDTO,
  UserSummaryDTO,
  CurrentUserDTO,
} from './UserDTO'
export { UserMapper } from './UserDTO'

// ============================================================================
// SCHEMA DTOs
// ============================================================================

export type {
  SchemaListDTO,
  SchemaDetailDTO,
  SchemaFieldSummaryDTO,
  SchemaSummaryDTO,
} from './SchemaDTO'
export { SchemaMapper } from './SchemaDTO'

// ============================================================================
// DASHBOARD DTOs
// ============================================================================

export type {
  PublicationStatusDTO,
  DashboardSummaryDTO,
  RecentActivityDTO,
  SystemHealthDTO,
  ContentMetricsDTO,
  QuickStatsDTO,
} from './DashboardDTO'
