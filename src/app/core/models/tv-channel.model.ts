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
  category?: TvChannelCategory;
  language?: Language;
}

export interface TvChannelCreateRequest {
  channelNumber: number;
  name: string;
  description?: string;
  ip: string;
  port: number;
  logoUrl?: string;
  categoryId: number;
  languageId: number;
}

export interface TvChannelUpdateRequest {
  channelNumber?: number;
  name?: string;
  description?: string;
  ip?: string;
  port?: number;
  logoUrl?: string;
  categoryId?: number;
  languageId?: number;
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