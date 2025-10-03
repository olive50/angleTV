// Updated interfaces to match backend DTOs
export interface Guest {
  id: number;
  pmsGuestId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  vipStatus: boolean;
  loyaltyLevel: LoyaltyLevel;
  language?: LanguageDto;
  room?: RoomDto;
  createdAt: string;
  updatedAt: string;
}

export interface LanguageDto {
  id: number;
  name: string;
  code: string;
}

export interface RoomDto {
  id: number;
  roomNumber: string;
  roomType: 'STANDARD' | 'DELUXE' | 'SUITE' | 'PRESIDENTIAL';
  floorNumber: number;
}

export enum LoyaltyLevel {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND = 'DIAMOND',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export interface GuestCreateDto {
  pmsGuestId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  nationality?: string;
  dateOfBirth?: string;
  gender?: Gender;
  vipStatus?: boolean;
  loyaltyLevel?: LoyaltyLevel;
  languageId?: number;
  roomId?: number;
}

export interface GuestUpdateDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  nationality?: string;
  dateOfBirth?: string;
  gender?: Gender;
  vipStatus?: boolean;
  loyaltyLevel?: LoyaltyLevel;
  languageId?: number;
  roomId?: number;
}

export interface GuestSearchDto {
  searchTerm?: string;
  nationality?: string;
  gender?: Gender;
  vipStatus?: boolean;
  loyaltyLevel?: LoyaltyLevel;
  roomId?: number;
  sortBy?: string;
  sortDirection?: string;
  page?: number;
  size?: number;
}

export interface TvBootHttpResponse<T = any> {
  timeStamp: string;
  statusCode: number;
  status: string;
  reason: string;
  message: string;
  developerMessage?: string;
  data?: { [key: string]: any };
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface GuestStatistics {
  totalGuests: number;
  vipGuests: number;
  recentGuests: number;
  vipPercentage: number;
  nationalityDistribution: { [key: string]: number };
  loyaltyLevelDistribution: { [key: string]: number };
  genderDistribution: { [key: string]: number };
}
