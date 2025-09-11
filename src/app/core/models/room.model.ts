// src/app/core/models/room.model.ts

export enum RoomType {
  STANDARD = 'STANDARD',
  DELUXE = 'DELUXE',
  SUITE = 'SUITE',
  PRESIDENTIAL_SUITE = 'PRESIDENTIAL_SUITE',
  FAMILY_ROOM = 'FAMILY_ROOM',
  STUDIO = 'STUDIO',
  JUNIOR_SUITE = 'JUNIOR_SUITE',
  PENTHOUSE = 'PENTHOUSE'
}

export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_ORDER = 'OUT_OF_ORDER',
  CLEANING = 'CLEANING',
  CHECKOUT_PENDING = 'CHECKOUT_PENDING',
  CHECKIN_READY = 'CHECKIN_READY'
}

export enum ViewType {
  CITY = 'CITY',
  OCEAN = 'OCEAN',
  GARDEN = 'GARDEN',
  MOUNTAIN = 'MOUNTAIN',
  POOL = 'POOL',
  COURTYARD = 'COURTYARD',
  INTERIOR = 'INTERIOR'
}

export enum BedType {
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  QUEEN = 'QUEEN',
  KING = 'KING',
  TWIN = 'TWIN',
  SOFA_BED = 'SOFA_BED',
  BUNK_BED = 'BUNK_BED'
}

export enum MaintenanceType {
  CLEANING = 'CLEANING',
  REPAIR = 'REPAIR',
  INSPECTION = 'INSPECTION',
  UPGRADE = 'UPGRADE',
  PREVENTIVE = 'PREVENTIVE'
}

export enum MaintenanceStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Room {
  id: number;
  roomNumber: string;
  roomType: RoomType;
  floorNumber: number;
  building: string;
  maxOccupancy: number;
  pricePerNight: number;
  status: RoomStatus;
  description: string;
  amenities: string[];
  hasBalcony?: boolean;
  hasKitchen?: boolean;
  accessibility?: boolean;
  viewType?: ViewType;
  bedType?: BedType;
  images?: string[];
  lastCleaned?: Date;
  lastMaintenance?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  currentGuest?: {
    id?: number;
    name: string;
    email?: string;
    phone?: string;
    checkIn?: Date;
    checkOut: Date;
  };
}

export interface RoomCreateRequest {
  roomNumber: string;
  roomType: RoomType;
  floorNumber: number;
  building: string;
  maxOccupancy: number;
  pricePerNight: number;
  description: string;
  amenities: string[];
  hasBalcony?: boolean;
  hasKitchen?: boolean;
  accessibility?: boolean;
  viewType?: ViewType;
  bedType?: BedType;
  images?: string[];
}

export interface RoomUpdateRequest extends Partial<RoomCreateRequest> {
  status?: RoomStatus;
}

export interface RoomFilters {
  search?: string;
  roomType?: RoomType;
  status?: RoomStatus;
  floorNumber?: number;
  building?: string;
  minPrice?: number;
  maxPrice?: number;
  hasBalcony?: boolean;
  hasKitchen?: boolean;
  accessibility?: boolean;
  viewType?: ViewType;
  bedType?: BedType;
  maxOccupancy?: number;
}

export interface RoomStatistics {
  total: number;
  available: number;
  occupied: number;
  reserved: number;
  maintenance: number;
  outOfOrder: number;
  cleaning: number;
  occupancyRate: number;
  averagePricePerNight: number;
  revenueToday: number;
  revenueThisMonth: number;
  byType: { [key: string]: number };
  byFloor: { [key: string]: number };
  byStatus: { [key: string]: number };
}

export interface RoomAvailability {
  roomId: number;
  available: boolean;
  conflictingReservations?: any[];
  suggestedAlternatives?: Room[];
}

export interface MaintenanceRecord {
  id: number;
  roomId: number;
  type: MaintenanceType;
  status: MaintenanceStatus;
  description: string;
  scheduledDate: Date;
  completedDate?: Date;
  assignedTo?: string;
  cost?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}