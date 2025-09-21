export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  errors?: string[];
}

export interface SpringBootPageable {
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
}

export interface SpringBootPageResponse<T> {
  content: T[];
  pageable: SpringBootPageable;
  last: boolean;
  totalElements: number;
  totalPages: number;
  numberOfElements: number;
  first: boolean;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  empty: boolean;
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
// Ajoutez cette interface dans votre fichier de modèles ou dans le service
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
