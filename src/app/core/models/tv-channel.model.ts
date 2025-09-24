// src/app/core/models/tv-channel.model.ts
import { Language } from './language.model';
import { TvChannelCategory } from './tv-channel-category.model';

export interface TvChannel {
  id?: number;
  channelNumber: number;
  name: string;
  description?: string;
  ip: string;
  port: number;
  logoUrl?: string | null;
  streamUrl?: string | null;
  logoPath?: string | null;
  category?: TvChannelCategory;
  language?: Language;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  // Additional metadata that might be useful
  streamType?: StreamType;
  encodingFormat?: EncodingFormat;
  bitrate?: number;
  resolution?: string;
  aspectRatio?: string;
  audioCodec?: string;
  videoCodec?: string;

  // EPG (Electronic Program Guide) information
  epgUrl?: string;
  hasEpg?: boolean;

  // Access control
  isEncrypted?: boolean;
  requiresAuth?: boolean;
  allowedCountries?: string[];

  // Statistics and monitoring
  viewerCount?: number;
  uptime?: number;
  lastChecked?: Date;
  averageResponseTime?: number;
}

export interface TvChannelCreateRequest {
  channelNumber: number;
  name: string;
  description?: string;
  ip: string;
  port: number;
  logoUrl?: string;
  streamUrl?: string;
  categoryId: number;
  languageId: number;
  isActive?: boolean;
  streamType?: StreamType;
  encodingFormat?: EncodingFormat;
  bitrate?: number;
  resolution?: string;
  aspectRatio?: string;
  audioCodec?: string;
  videoCodec?: string;
  epgUrl?: string;
  hasEpg?: boolean;
  isEncrypted?: boolean;
  requiresAuth?: boolean;
  allowedCountries?: string[];
}

export interface TvChannelUpdateRequest {
  channelNumber?: number;
  name?: string;
  description?: string;
  ip?: string;
  port?: number;
  streamUrl?: string;
  logoUrl?: string;
  categoryId?: number; // ✅ Optional - only sent if changed
  languageId?: number; // ✅ Optional - only sent if changed
  active?: boolean;
}

// Enums for additional channel properties
export enum StreamType {
  LIVE = 'LIVE',
  VOD = 'VOD',
  TIMESHIFT = 'TIMESHIFT',
  CATCHUP = 'CATCHUP',
}

export enum EncodingFormat {
  H264 = 'H264',
  H265 = 'H265',
  VP8 = 'VP8',
  VP9 = 'VP9',
  AV1 = 'AV1',
}

// Channel status enumeration
export enum ChannelStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  ERROR = 'ERROR',
  TESTING = 'TESTING',
}

// Filter interfaces
// export interface ChannelFilters {
//   search?: string;
//   categoryId?: number;
//   languageId?: number;
//   isActive?: boolean;
//   streamType?: StreamType;
//   status?: ChannelStatus;
//   hasLogo?: boolean;
//   hasEpg?: boolean;
//   countryCode?: string;
// }

export interface ChannelFilters {
  search?: string;
  categoryId?: number;
  languageId?: number;
  isActive?: boolean;
}

// Sorting options
export interface ChannelSortOptions {
  field: ChannelSortField;
  direction: 'asc' | 'desc';
}

export enum ChannelSortField {
  CHANNEL_NUMBER = 'channelNumber',
  NAME = 'name',
  CATEGORY = 'category',
  LANGUAGE = 'language',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  VIEWER_COUNT = 'viewerCount',
  UPTIME = 'uptime',
}

// Spring Boot Page response format
export interface PagedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

// Channel statistics
export interface ChannelStatistics {
  totalChannels: number;
  activeChannels: number;
  inactiveChannels: number;
  channelsByCategory: { [categoryName: string]: number };
  channelsByLanguage: { [languageName: string]: number };
  channelsByStreamType: { [streamType: string]: number };
  averageUptime: number;
  totalViewers: number;
  channelsWithIssues: number;
}

// Connectivity test result
export interface ConnectivityTestResult {
  success: boolean;
  message: string;
  responseTime?: number;
  timestamp: Date;
  errorCode?: string;
  details?: {
    ping: boolean;
    streamAvailable: boolean;
    audioTrack: boolean;
    videoTrack: boolean;
    bitrate?: number;
    resolution?: string;
  };
}

// Bulk operations
export interface BulkOperationRequest {
  channelIds: number[];
  operation: BulkOperation;
  parameters?: { [key: string]: any };
}

export enum BulkOperation {
  DELETE = 'DELETE',
  ACTIVATE = 'ACTIVATE',
  DEACTIVATE = 'DEACTIVATE',
  UPDATE_CATEGORY = 'UPDATE_CATEGORY',
  UPDATE_LANGUAGE = 'UPDATE_LANGUAGE',
  TEST_CONNECTIVITY = 'TEST_CONNECTIVITY',
}

export interface BulkOperationResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: string[];
  results: { [channelId: number]: any };
}

// Import/Export interfaces
export interface ChannelImportResult {
  totalRows: number;
  imported: number;
  skipped: number;
  errors: ChannelImportError[];
}

export interface ChannelImportError {
  row: number;
  field: string;
  value: string;
  error: string;
}

export interface ChannelExportOptions {
  format: 'csv' | 'excel' | 'json' | 'xml';
  includeInactive: boolean;
  categories?: number[];
  languages?: number[];
  fields?: string[];
}

// Channel validation
export interface ChannelValidationResult {
  isValid: boolean;
  errors: ChannelValidationError[];
  warnings: ChannelValidationWarning[];
}

export interface ChannelValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ChannelValidationWarning {
  field: string;
  message: string;
  code: string;
}

// EPG (Electronic Program Guide) related interfaces
export interface EpgProgram {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  category?: string;
  rating?: string;
  language?: string;
  isLive: boolean;
  isRerun: boolean;
}

export interface ChannelEpg {
  channelId: number;
  programs: EpgProgram[];
  lastUpdated: Date;
  nextUpdate: Date;
}

// Search and filtering
export interface ChannelSearchRequest {
  query: string;
  filters?: ChannelFilters;
  sortBy?: ChannelSortOptions;
  page?: number;
  size?: number;
}

export interface ChannelSearchResult {
  channels: PagedResponse<TvChannel>;
  facets: {
    categories: { [key: string]: number };
    languages: { [key: string]: number };
    streamTypes: { [key: string]: number };
  };
  suggestions: string[];
}

// Monitoring and health
export interface ChannelHealth {
  channelId: number;
  status: ChannelStatus;
  lastChecked: Date;
  responseTime: number;
  uptime: number;
  issues: ChannelIssue[];
  metrics: ChannelMetrics;
}

export interface ChannelIssue {
  type: IssueType;
  severity: IssueSeverity;
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export enum IssueType {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  STREAM_UNAVAILABLE = 'STREAM_UNAVAILABLE',
  POOR_QUALITY = 'POOR_QUALITY',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  EPG_OUTDATED = 'EPG_OUTDATED',
  LOGO_MISSING = 'LOGO_MISSING',
}

export enum IssueSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface ChannelMetrics {
  viewerCount: number;
  bandwidth: number;
  quality: {
    video: QualityMetric;
    audio: QualityMetric;
  };
  errors: {
    count: number;
    rate: number;
    types: { [errorType: string]: number };
  };
}

export interface QualityMetric {
  bitrate: number;
  fps?: number;
  resolution?: string;
  codec: string;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

// Configuration templates
export interface ChannelTemplate {
  id: number;
  name: string;
  description: string;
  template: Partial<TvChannelCreateRequest>;
  isDefault: boolean;
  categoryId?: number;
}

// User preferences and favorites
export interface UserChannelPreferences {
  userId: number;
  favoriteChannels: number[];
  hiddenChannels: number[];
  customOrder: number[];
  defaultLanguage?: number;
  defaultCategory?: number;
}

export interface TvChannelStats {
  total: number;
  active: number;
  inactive: number;
  byCategory: { [key: string]: number };
  byLanguage: { [key: string]: number };
}
