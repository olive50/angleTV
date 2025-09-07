export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    timestamp: string;
    errors?: string[];
  }

  // export interface ResponseWrapper<T> {
  //   success: boolean;
  //   message?: string;
  //   data: T;
  //   timestamp: number;
  // }
  
  export interface PagedApiResponse<T> {
    success: boolean;
    data: {
      content: T[];
      totalElements: number;
      totalPages: number;
      size: number;
      number: number;
      first: boolean;
      last: boolean;
    };
    message?: string;
    timestamp: string;
  }
  