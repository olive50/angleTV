export interface Terminal {
    id: number;
    terminalId: string;
    deviceType: DeviceType;
    brand: string;
    model: string;
    macAddress: string;
    ipAddress: string;
    status: TerminalStatus;
    location: string;
    // room?: Room;
    lastSeen: Date;
    firmwareVersion?: string;
    serialNumber?: string;
    // configuration?: TerminalConfiguration;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export enum DeviceType {
    SET_TOP_BOX = 'SET_TOP_BOX',
    SMART_TV = 'SMART_TV',
    DESKTOP_PC = 'DESKTOP_PC',
    TABLET = 'TABLET',
    MOBILE = 'MOBILE',
    DISPLAY_SCREEN = 'DISPLAY_SCREEN'
  }
  
  export enum TerminalStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    MAINTENANCE = 'MAINTENANCE',
    OFFLINE = 'OFFLINE',
    FAULTY = 'FAULTY'
  }