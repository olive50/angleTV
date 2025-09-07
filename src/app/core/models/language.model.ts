// interfaces/channel.interface.ts
export interface Language {
  id: number;
  name: string;
  nativeName: string;
  iso6391: string;
  iso6392: string;
  localeCode: string;
  charset: string;
  flagUrl: string;
  flagPath: string;
  flagSource: string;
  isRtl: boolean;
  isActive: boolean;
  isDefault: boolean;
  isAdminEnabled: boolean;
  isGuestEnabled: boolean;
  displayOrder: number;
  fontFamily: string;
  currencyCode: string;
  currencySymbol: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  decimalSeparator: string;
  thousandsSeparator: string;
  uiTranslationProgress: number;
  channelTranslationProgress: number;
  epgTranslationEnabled: boolean;
  welcomeMessage: string;
  supportedPlatforms: string[];
  overallTranslationProgress: number;
  isFullyTranslated: boolean;
  isReadyForDisplay: boolean;
  isAvailableForAdmin: boolean;
  isAvailableForGuests: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastModifiedBy: string;
}



