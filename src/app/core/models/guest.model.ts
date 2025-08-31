export interface Guest {
    id: number;
    guestId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    nationality: string;
    idNumber: string;
    vipStatus: boolean;
    loyaltyLevel: LoyaltyLevel;
    // currentRoom?: Room;
    checkInDate?: Date;
    checkOutDate?: Date;
    reservationStatus: ReservationStatus;
    // preferences?: GuestPreferences;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export enum LoyaltyLevel {
    BRONZE = 'BRONZE',
    SILVER = 'SILVER',
    GOLD = 'GOLD',
    PLATINUM = 'PLATINUM',
    DIAMOND = 'DIAMOND'
  }
  
  export enum ReservationStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CHECKED_IN = 'CHECKED_IN',
    CHECKED_OUT = 'CHECKED_OUT',
    CANCELLED = 'CANCELLED'
  }