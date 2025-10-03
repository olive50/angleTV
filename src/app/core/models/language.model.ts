// src/app/core/models/language.model.ts

/**
 * Language interface matching the backend LanguageResponseDTO
 */
export interface Language {
  id: number;
  name: string;
  nativeName?: string;
  iso6391?: string;
  iso6392?: string;
  localeCode?: string;

  charset?: string;
  flagPath?: string;
  flagUrl?: string;

  isRtl?: boolean;
  isAdminEnabled?: boolean;
  isGuestEnabled?: boolean;

  displayOrder?: number;
  fontFamily?: string;

  currencyCode?: string;
  currencySymbol?: string;

  dateFormat?: string;
  timeFormat?: string;
  numberFormat?: string;
  decimalSeparator?: string;
  thousandsSeparator?: string;

  createdAt?: string;
  updatedAt?: string;
}

/**
 * DTO for creating a new language
 */
export interface LanguageCreateDTO {
  name: string;
  nativeName?: string;
  iso6391: string;
  iso6392?: string;
  localeCode?: string;
  charset?: string;
  currencyCode?: string;
  currencySymbol?: string;
  isAdminEnabled?: boolean;
  isGuestEnabled?: boolean;
  isRtl?: boolean;
  displayOrder?: number;
  fontFamily?: string;
  dateFormat?: string;
  timeFormat?: string;
  numberFormat?: string;
  decimalSeparator?: string;
  thousandsSeparator?: string;
}

/**
 * DTO for updating an existing language
 */
export interface LanguageUpdateDTO {
  name?: string;
  nativeName?: string;
  iso6391?: string;
  iso6392?: string;
  localeCode?: string;
  charset?: string;
  currencyCode?: string;
  currencySymbol?: string;
  isAdminEnabled?: boolean;
  isGuestEnabled?: boolean;
  isRtl?: boolean;
  displayOrder?: number;
  fontFamily?: string;
  dateFormat?: string;
  timeFormat?: string;
  numberFormat?: string;
  decimalSeparator?: string;
  thousandsSeparator?: string;
}

/**
 * Language statistics from the API
 */
export interface LanguageStatsDTO {
  total: number;
  adminEnabled: number;
  guestEnabled: number;
  rtlLanguages: number;
  byCharset: { [key: string]: number };
  byCurrency: { [key: string]: number };
}

/**
 * Generic TvBoot API Response structure
 */
export interface TvBootHttpResponse<T = any> {
  timeStamp: string;
  statusCode: number;
  status: string;
  reason: string;
  message: string;
  data: T;
  developerMessage?: string;
  pagination?: PaginationInfo;
}

/**
 * Pagination information
 */
export interface PaginationInfo {
  page: number;
  size: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Language API Response wrapper
 */
export interface LanguageApiResponse {
  timeStamp: string;
  statusCode: number;
  status: string;
  reason: string;
  message: string;
  data: {
    languages: Language[];
    language?: Language;
    searchQuery?: string;
    resultsFound?: number;
    deletedLanguageId?: number;
  };
  pagination?: PaginationInfo;
}
