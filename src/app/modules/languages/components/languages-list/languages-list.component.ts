import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Language } from 'src/app/core/models/language.model';
import { LanguageService } from 'src/app/core/services/language.service';

@Component({
  selector: 'app-languages-list',
  templateUrl: './languages-list.component.html',
  styleUrls: ['./languages-list.component.css'],
})
export class LanguagesListComponent implements OnInit, OnDestroy {
  languages: Language[] = [];
  filteredLanguages: Language[] = [];

  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;

  // Filters
  searchTerm = '';
  activeFilter: string | null = null;
  isAdminFilter: boolean | undefined = undefined;
  isGuestFilter: boolean | undefined = undefined;
  isRtlFilter: boolean | undefined = undefined;

  // Loading state
  loading = false;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadLanguages();

    // Subscribe to loading state
    this.languageService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading) => (this.loading = loading));

    // Subscribe to error state
    this.languageService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe((error) => (this.error = error));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLanguages(): void {
    // Use search endpoint for filtering
    if (
      this.searchTerm ||
      this.isAdminFilter !== undefined ||
      this.isGuestFilter !== undefined ||
      this.isRtlFilter !== undefined
    ) {
      this.searchLanguages();
    } else {
      // Load all languages
      this.languageService
        .getAllLanguages(this.currentPage, this.pageSize)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.languages = response.languages;
            this.filteredLanguages = response.languages;
            this.updatePagination(response.pagination);
          },
          error: (error) => {
            console.error('Error loading languages:', error);
            this.error = error.message;
          },
        });
    }
  }

  searchLanguages(): void {
    this.languageService
      .searchLanguages(
        this.searchTerm,
        this.isAdminFilter,
        this.isGuestFilter,
        this.isRtlFilter,
        this.currentPage,
        this.pageSize
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.languages = response.languages;
          this.filteredLanguages = response.languages;
          this.updatePagination(response.pagination);
        },
        error: (error) => {
          console.error('Error searching languages:', error);
          this.error = error.message;
        },
      });
  }

  onSearch(): void {
    this.currentPage = 0; // Reset to first page on new search
    this.loadLanguages();
  }

  onFilterChange(): void {
    this.currentPage = 0; // Reset to first page on filter change

    // Convert activeFilter string to boolean
    if (this.activeFilter === 'true') {
      this.isAdminFilter = true;
      this.isGuestFilter = true;
    } else if (this.activeFilter === 'false') {
      this.isAdminFilter = false;
      this.isGuestFilter = false;
    } else {
      this.isAdminFilter = undefined;
      this.isGuestFilter = undefined;
    }

    this.loadLanguages();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.activeFilter = null;
    this.isAdminFilter = undefined;
    this.isGuestFilter = undefined;
    this.isRtlFilter = undefined;
    this.currentPage = 0;
    this.loadLanguages();
  }

  // Pagination methods
  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadLanguages();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadLanguages();
    }
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadLanguages();
    }
  }

  private updatePagination(pagination: any): void {
    if (pagination) {
      this.currentPage = pagination.page;
      this.pageSize = pagination.size;
      this.totalElements = pagination.total;
      this.totalPages = pagination.totalPages;
    }
  }

  editLanguage(id: number): void {
    this.router.navigate(['/languages', id, 'edit']);
  }

  deleteLanguage(id: number): void {
    if (confirm('Are you sure you want to delete this language?')) {
      this.languageService
        .deleteLanguage(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('Language deleted successfully');
            this.loadLanguages(); // Reload the list
          },
          error: (error) => {
            console.error('Error deleting language:', error);
            alert('Failed to delete language: ' + error.message);
          },
        });
    }
  }

  addLanguage(): void {
    this.router.navigate(['/languages/add']);
  }

  // Helper method to get flag emoji or default
  getLanguageFlag(language: Language): string {
    // If you have flag path/URL from backend
    if (language.flagPath) {
      return language.flagPath;
    }
    // Return default flag based on ISO code or empty
    return '🏳️';
  }

  // Helper method to format language code
  getLanguageCode(language: Language): string {
    return language.iso6391 || language.iso6392 || 'N/A';
  }

  // Helper to check if language is active
  isLanguageActive(language: Language): boolean {
    return language.isAdminEnabled || language.isGuestEnabled || false;
  }

  // Helper for image error handling
  // onImageError(event: Event): void {
  //   const img = event.target as HTMLImageElement;
  //   img.src = 'assets/images/default-flag.png';
  // }

  // Helper for pagination display
  getMaxDisplayed(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }
}
