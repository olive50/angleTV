export interface Terminal {
  id: number;
  terminalCode: string;
  deviceType?: DeviceType;

  brand: string;
  model: string;
  macAddress: string;
  ipAddress: string;
  status: TerminalStatus;
  location: string;
  room?: { id: number; roomNumber: string };
  lastSeen: string;
  firmwareVersion?: string;
  serialNumber?: string;
  platform?: string;
  isOnline: boolean;
  uptime?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TerminalCreateRequest {
  terminalCode: string;
  deviceType: string;
  brand: string;
  model: string;
  macAddress: string;
  ipAddress: string;
  location: string;
  firmwareVersion?: string;
  serialNumber?: string;
  roomId?: number;
}

export interface TerminalUpdateRequest {
  terminalCode?: string;
  deviceType?: string;
  brand?: string;
  model?: string;
  macAddress?: string;
  ipAddress?: string;
  status?: string;
  location?: string;
  firmwareVersion?: string;
  serialNumber?: string;
  roomId?: number;
}

export interface TerminalSearchCriteria {
  search?: string;
  status?: string;
  deviceType?: string;
  location?: string;
  roomId?: number;
}

export interface ConnectivityTestResult {
  success: boolean;
  message: string;
  timestamp: string;
  responseTime?: number;
  packetLoss?: number;
}

export interface TerminalStats {
  total: number;
  active: number;
  inactive: number;
  offline: number;
  maintenance: number;
  faulty: number;
  byDeviceType: { [key: string]: number };
  byLocation: { [key: string]: number };
  averageUptime?: number;
}

// TvBootHttpResponse interfaces
export interface TvBootHttpResponse<T = any> {
  timeStamp: string;
  statusCode: number;
  status: string;
  reason: string;
  message: string;
  developerMessage?: string;
  data?: T;
}

export interface PaginationData {
  page: number;
  size: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PagedTerminalResponse {
  terminals: Terminal[];
  pagination: PaginationData;
}

export enum DeviceType {
  SET_TOP_BOX = 'SET_TOP_BOX',
  SMART_TV = 'SMART_TV',
  DESKTOP_PC = 'DESKTOP_PC',
  TABLET = 'TABLET',
  MOBILE = 'MOBILE',
  DISPLAY_SCREEN = 'DISPLAY_SCREEN',
}

export enum TerminalStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  OFFLINE = 'OFFLINE',
  FAULTY = 'FAULTY',
}
