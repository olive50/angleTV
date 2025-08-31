// src/app/modules/tv-channels/components/tv-channels-list/tv-channels-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, combineLatest, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, catchError } from 'rxjs/operators';
import { TvChannelService, ChannelFilters, PagedChannelResponse } from '../../../../core/services/tv-channel.service';
import { LanguageService } from '../../../../core/services/language.service';
import { TvChannelCategoryService } from '../../../../core/services/tv-channel-category.service';
import { TvChannel } from '../../../../core/models/tv-channel.model';
import { Language } from '../../../../core/models/language.model';
import { TvChannelCategory } from '../../../../core/models/tv-channel-category.model';

@Component({
  selector: 'app-tv-channels-list',
  templateUrl: './tv-channels-list.component.html',
  styleUrls: ['./tv-channels-list.component.css']
})
export class TvChannelsListComponent implements OnInit, OnDestroy {
  // Data properties
  channels: TvChannel[] = [];
  categories: TvChannelCategory[] = [
    { id: 1, name: 'News', description: 'News channels' },
    { id: 2, name: 'Sports', description: 'Sports channels' },
    { id: 3, name: 'Documentary', description: 'Documentary channels' },
    { id: 4, name: 'Entertainment', description: 'Entertainment channels' }
  ];
  languages: Language[] = [
    { id: 1, name: 'English', code: 'EN' },
    { id: 2, name: 'Arabic', code: 'AR' },
    { id: 3, name: 'French', code: 'FR' }
  ];
  
  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;
  
  // Filtering
  filters: ChannelFilters = {};
  searchTerm = '';
  selectedCategoryId: number | null = null;
  selectedLanguageId: number | null = null;
  sortBy = 'channelNumber';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // State management
  loading$ = this.tvChannelService.loading$;
  error: string | null = null;
  
  // Utility
  Math = Math; // Expose Math to template
  
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private tvChannelService: TvChannelService,
    private languageService: LanguageService,
    private categoryService: TvChannelCategoryService,
    private router: Router
  ) {
    this.setupSearchDebounce();
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Setup search with debounce
  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.applyFilters();
    });
  }

  // Load initial data (categories, languages, then channels)
  private loadInitialData(): void {
    this.error = null;
    
    // Try to load categories and languages, but don't block if they fail
    combineLatest([
      this.categoryService.getAllCategories().pipe(
        catchError(error => {
          console.warn('Failed to load categories:', error);
          return of(this.categories); // Use default categories
        })
      ),
      this.languageService.getAllLanguages().pipe(
        catchError(error => {
          console.warn('Failed to load languages:', error);
          return of(this.languages); // Use default languages
        })
      )
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ([categories, languages]) => {
        this.categories = categories;
        this.languages = languages;
        this.loadChannels();
      },
      error: (error) => {
        console.error('Error loading initial data:', error);
        // Still try to load channels even if categories/languages fail
        this.loadChannels();
      }
    });
  }

  // Load channels with current filters and pagination
  private loadChannels(): void {
    this.error = null;
    
    this.tvChannelService.getChannelsPaged(
      this.currentPage,
      this.pageSize,
      this.sortBy,
      this.sortDirection,
      this.filters
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: PagedChannelResponse) => {
        console.log('API Response received:', response); // Debug log
        
        // Handle Spring Boot Page response format
        if (response && response.content) {
          this.channels = response.content;
          this.totalElements = response.totalElements;
          this.totalPages = response.totalPages;
          
          console.log(`Loaded ${this.channels.length} channels, total: ${this.totalElements}`);
        } else {
          console.warn('Invalid response format:', response);
          this.channels = [];
          this.totalElements = 0;
          this.totalPages = 0;
        }
        
        this.error = null;
      },
      error: (error) => {
        console.error('Error loading channels:', error);
        this.error = this.getErrorMessage(error);
        this.channels = [];
        this.totalElements = 0;
        this.totalPages = 0;
      }
    });
  }

  // Get user-friendly error message
  private getErrorMessage(error: any): string {
    if (error?.message) {
      return error.message;
    }
    if (error?.error?.message) {
      return error.error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Failed to load channels. Please try again.';
  }

  // Handle search input
  onSearchChange(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  // Handle filter changes
  onFilterChange(): void {
    this.currentPage = 0; // Reset to first page when filters change
    this.applyFilters();
  }

  // Apply current filters and reload data
  private applyFilters(): void {
    this.filters = {
      search: this.searchTerm || undefined,
      categoryId: this.selectedCategoryId || undefined,
      languageId: this.selectedLanguageId || undefined
    };
    
    this.loadChannels();
  }

  // Clear all filters
  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategoryId = null;
    this.selectedLanguageId = null;
    this.filters = {};
    this.currentPage = 0;
    this.loadChannels();
  }

  // Pagination handlers
  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadChannels();
    }
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
    this.loadChannels();
  }

  // Generate page numbers for pagination
  getPageNumbers(): number[] {
    const maxPages = 5;
    const pages: number[] = [];
    
    if (this.totalPages === 0) return pages;
    
    let startPage = Math.max(0, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages - 1, startPage + maxPages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(0, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  // Sorting
  onSortChange(sortBy: string): void {
    if (this.sortBy === sortBy) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortDirection = 'asc';
    }
    this.currentPage = 0;
    this.loadChannels();
  }

  // Navigation methods
  addChannel(): void {
    this.router.navigate(['/channels/add']);
  }

  viewChannel(id?: number): void {
    if (id) {
      this.router.navigate(['/channels', id]);
    }
  }

  editChannel(id?: number): void {
    if (id) {
      this.router.navigate(['/channels', id, 'edit']);
    }
  }

  // Channel operations
  deleteChannel(id?: number): void {
    if (!id) return;
    
    if (confirm('Are you sure you want to delete this channel? This action cannot be undone.')) {
      this.tvChannelService.deleteChannel(id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.loadChannels(); // Refresh the list
        },
        error: (error) => {
          console.error('Error deleting channel:', error);
          this.error = this.getErrorMessage(error);
        }
      });
    }
  }

  // Refresh data
  refreshChannels(): void {
    this.tvChannelService.clearCache();
    this.error = null;
    this.loadChannels();
  }

  // Export functionality
  exportChannels(): void {
    try {
      // Create CSV content
      const headers = ['Channel Number', 'Name', 'Category', 'Language', 'IP', 'Port', 'Description'];
      const csvContent = [
        headers.join(','),
        ...this.channels.map(channel => [
          channel.channelNumber,
          `"${channel.name}"`,
          `"${channel.category?.name || ''}"`,
          `"${channel.language?.name || ''}"`,
          channel.ip,
          channel.port,
          `"${channel.description || ''}"`
        ].join(','))
      ].join('\n');
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tv-channels-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  }

  // Helper methods for template
  getCategoryName(categoryId?: number): string {
    if (!categoryId) return '';
    const category = this.categories.find(c => c.id === categoryId);
    return category?.name || '';
  }

  getLanguageName(languageId?: number): string {
    if (!languageId) return '';
    const language = this.languages.find(l => l.id === languageId);
    return language ? `${language.name} (${language.code})` : '';
  }

  // Get channel status (you might want to add this to your model)
  getChannelStatus(channel: TvChannel): 'active' | 'inactive' {
    // This is a placeholder - implement based on your business logic
    // For now, assume all channels are active
    return 'active';
  }

  // Get status class for styling
  getStatusClass(status: string): string {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'secondary';
      default: return 'secondary';
    }
  }
}