import { Language } from './language.model';
import { TvChannelCategory } from './tv-channel-category.model';

export interface TvChannel {
  id?: number;
  channelNumber: number;
  name: string;
  description?: string;
  ip: string;
  port: number;
  logoUrl?: string;
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

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
