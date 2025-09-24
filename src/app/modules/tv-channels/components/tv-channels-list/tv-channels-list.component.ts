// src/app/modules/tv-channels/components/tv-channels-list/tv-channels-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, combineLatest, of, timer } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  takeUntil,
  catchError,
  switchMap,
} from 'rxjs/operators';
import { TvChannelService } from '../../../../core/services/tv-channel.service';
import { LanguageService } from '../../../../core/services/language.service';
import { TvChannelCategoryService } from '../../../../core/services/tv-channel-category.service';
import {
  TvChannel,
  PagedResponse,
  BulkOperation,
  TvChannelStats,
  ChannelFilters,
} from '../../../../core/models/tv-channel.model';
import { Language } from '../../../../core/models/language.model';
import { TvChannelCategory } from '../../../../core/models/tv-channel-category.model';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { ConfirmService } from '../../../../shared/components/confirm/confirm.service';

@Component({
  selector: 'app-tv-channels-list',
  templateUrl: './tv-channels-list.component.html',
  styleUrls: ['./tv-channels-list.component.css'],
})
export class TvChannelsListComponent implements OnInit, OnDestroy {
  [x: string]: any;
  // Data properties
  channels: TvChannel[] = [];
  categories: TvChannelCategory[] = [];
  languages: Language[] = [];

  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;
  pageSizeOptions = [10, 20, 50, 100];

  // Filtering and Search
  filters: ChannelFilters = {};
  searchTerm = '';
  selectedCategoryId: number | null = null;
  selectedLanguageId: number | null = null;
  activeFilter: string | null = null;

  // Sorting
  sortBy = 'channelNumber';
  sortDirection: 'asc' | 'desc' = 'asc';

  // UI State
  loading$ = this.tvChannelService.loading$;
  error: string | null = null;
  showSuccessMessage = false;
  successMessage = '';

  // Selection and Bulk Operations
  selectedChannels = new Set<number>();
  bulkOperationsEnabled = false;
  showBulkMenu = false;

  // View options
  viewMode: 'table' | 'grid' = 'table';
  showAdvancedFilters = false;

  // Auto-refresh
  autoRefreshEnabled = false;
  autoRefreshInterval = 30000; // 30 seconds
  private autoRefreshTimer$ = new Subject<void>();

  // Statistics
  channelStats: TvChannelStats = {
    total: 0,
    active: 0,
    inactive: 0,
    byCategory: {},
    byLanguage: {},
  };

  // Utility
  Math = Math;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private tvChannelService: TvChannelService,
    private languageService: LanguageService,
    private categoryService: TvChannelCategoryService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService,
    private confirm: ConfirmService
  ) {
    this.setupSearchDebounce();
    this.setupAutoRefresh();
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.handleRouteParameters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.searchTerm = searchTerm;
        this.currentPage = 0; // Reset to first page
        this.applyFilters();
      });
  }

  private setupAutoRefresh(): void {
    this.autoRefreshTimer$
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => timer(this.autoRefreshInterval))
      )
      .subscribe(() => {
        if (this.autoRefreshEnabled) {
          this.refreshChannels();
        }
      });
  }

  private handleRouteParameters(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        if (params['message']) {
          this.showSuccessMessage = true;
          this.successMessage = params['message'];

          // Clear message after 5 seconds
          timer(5000)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
              this.showSuccessMessage = false;
            });

          // Clear URL parameters
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {},
            replaceUrl: true,
          });
        }
      });
  }

  private loadInitialData(): void {
    this.error = null;

    combineLatest([
      this.categoryService.getAllCategories().pipe(
        catchError((error) => {
          console.warn('Failed to load categories:', error);
          this.toast.warning('Could not load categories, using defaults');
          return of([
            { id: 1, name: 'News', description: 'News channels' },
            { id: 2, name: 'Sports', description: 'Sports channels' },
            { id: 3, name: 'Documentary', description: 'Documentary channels' },
            {
              id: 4,
              name: 'Entertainment',
              description: 'Entertainment channels',
            },
          ]);
        })
      ),
      this.languageService.getAdminLanguages().pipe(
        catchError((error) => {
          console.warn('Failed to load languages:', error);
          this.toast.warning('Could not load languages, using defaults');
          return of([
            {
              id: 1,
              name: 'English',
              nativeName: 'English',
              iso6391: 'en',
              iso6392: 'eng',
              localeCode: 'en-US',
              charset: 'UTF-8',
              flagUrl: 'https://flags.example.com/us.svg',
              flagPath: '/assets/flags/us.svg',
              flagSource: 'https://flags.example.com/us.svg',
              isRtl: false,
              isActive: true,
              isDefault: true,
              isAdminEnabled: true,
              isGuestEnabled: true,
              displayOrder: 1,
              fontFamily: 'Arial, sans-serif',
              currencyCode: 'USD',
              currencySymbol: '$',
              dateFormat: 'MM/dd/yyyy',
              timeFormat: 'hh:mm a',
              numberFormat: '#,##0.00',
              decimalSeparator: '.',
              thousandsSeparator: ',',
              uiTranslationProgress: 100,
              channelTranslationProgress: 95,
              epgTranslationEnabled: true,
              welcomeMessage: 'Welcome to our hotel entertainment system!',
              supportedPlatforms: ['WEBOS', 'WEB', 'ANDROID', 'IOS', 'TIZEN'],
              overallTranslationProgress: 97,
              isFullyTranslated: false,
              isReadyForDisplay: true,
              isAvailableForAdmin: true,
              isAvailableForGuests: true,
              createdAt: '2025-09-07T10:59:53',
              updatedAt: '2025-09-07T10:59:53',
              createdBy: 'system',
              lastModifiedBy: 'system',
            },
          ]);
        })
      ),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([categories, languages]) => {
          this.categories = categories;
          this.languages = languages;
          this.loadChannels();
          this.loadChannelStats();
        },
        error: (error) => {
          console.error('Error loading initial data:', error);
          this.toast.error('Failed to load initial data');
          this.loadChannels(); // Still try to load channels
        },
      });
  }

  private loadChannels(): void {
    this.error = null;
    this.selectedChannels.clear();

    this.tvChannelService
      .getChannelsPaged(
        this.currentPage,
        this.pageSize,
        this.sortBy,
        this.sortDirection,
        this.filters
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PagedResponse<TvChannel>) => {
          if (response && response.content) {
            this.channels = response.content;
            this.totalElements = response.totalElements;
            this.totalPages = response.totalPages;
            console.log(
              `Loaded ${this.channels.length} channels, total: ${this.totalElements}`
            );
          } else {
            this.handleInvalidResponse(response);
          }
          this.error = null;
        },
        error: (error) => {
          this.handleLoadError(error);
        },
      });
  }

  private loadChannelStats(): void {
    this.tvChannelService
      .getChannelStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.channelStats = {
            ...stats,
            inactive: 0, // Provide a default value
          };
        },
        error: (error) => {
          console.warn('Failed to load channel statistics:', error);
          this.error = 'Failed to load statistics';
          this.toast.warning('Could not load channel statistics');
        },
      });
  }

  private handleInvalidResponse(response: any): void {
    console.warn('Invalid response format:', response);
    this.channels = [];
    this.totalElements = 0;
    this.totalPages = 0;
    this.error = 'Invalid response format from server';
    this.toast.error('Invalid response from server while loading channels');
  }

  private handleLoadError(error: any): void {
    console.error('Error loading channels:', error);
    this.error = this.getErrorMessage(error);
    this.channels = [];
    this.totalElements = 0;
    this.totalPages = 0;
    this.toast.error(this.error);
  }

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

  // Search and Filter Methods
  onSearchChange(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.applyFilters();
  }

  private applyFilters(): void {
    this.filters = {
      search: this.searchTerm || undefined,
      categoryId: this.selectedCategoryId || undefined,
      languageId: this.selectedLanguageId || undefined,
      isActive:
        this.activeFilter === 'active'
          ? true
          : this.activeFilter === 'inactive'
          ? false
          : undefined,
    };

    this.loadChannels();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategoryId = null;
    this.selectedLanguageId = null;
    this.activeFilter = null;
    this.filters = {};
    this.currentPage = 0;
    this.loadChannels();
    this.toast.info('Filters cleared');
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  // Sorting Methods
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

  getSortIcon(field: string): string {
    if (this.sortBy !== field) return 'fa-sort';
    return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  // Pagination Methods
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

  getPageNumbers(): number[] {
    const maxPages = 5;
    const pages: number[] = [];

    if (this.totalPages === 0) return pages;

    let startPage = Math.max(0, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages - 1, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(0, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Selection and Bulk Operations
  toggleChannelSelection(channelId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (this.selectedChannels.has(channelId)) {
      this.selectedChannels.delete(channelId);
    } else {
      this.selectedChannels.add(channelId);
    }

    this.bulkOperationsEnabled = this.selectedChannels.size > 0;
  }

  toggleAllChannels(event: Event): void {
    const target = event.target as HTMLInputElement;

    if (target.checked) {
      this.channels.forEach((channel) => {
        if (channel.id) {
          this.selectedChannels.add(channel.id);
        }
      });
    } else {
      this.selectedChannels.clear();
    }

    this.bulkOperationsEnabled = this.selectedChannels.size > 0;
  }

  isChannelSelected(channelId: number): boolean {
    return this.selectedChannels.has(channelId);
  }

  areAllChannelsSelected(): boolean {
    if (this.channels.length === 0) return false;
    return this.channels.every(
      (channel) => channel.id && this.selectedChannels.has(channel.id)
    );
  }

  getSelectedChannelsCount(): number {
    return this.selectedChannels.size;
  }

  performBulkOperation(operation: string): void {
    const bulkOp = operation as BulkOperation;
    const channelIds = Array.from(this.selectedChannels);

    if (channelIds.length === 0) {
      this.toast.info('Please select at least one channel');
      return;
    }

    const confirmMessage = this.getBulkOperationConfirmMessage(
      bulkOp,
      channelIds.length
    );

    this.confirm
      .open('Confirm bulk action', confirmMessage, 'Proceed', 'Cancel')
      .then((ok) => {
        if (!ok) return;
        switch (operation) {
          case BulkOperation.DELETE:
            this.performBulkDelete(channelIds);
            break;
          case BulkOperation.ACTIVATE:
            this.performBulkStatusChange(channelIds, true);
            break;
          case BulkOperation.DEACTIVATE:
            this.performBulkStatusChange(channelIds, false);
            break;
          case BulkOperation.TEST_CONNECTIVITY:
            this.performBulkConnectivityTest(channelIds);
            break;
          default:
            this.toast.info('This bulk operation is not yet implemented');
        }
      });
  }

  private getBulkOperationConfirmMessage(
    operation: BulkOperation,
    count: number
  ): string {
    switch (operation) {
      case BulkOperation.DELETE:
        return `Are you sure you want to delete ${count} selected channel${
          count > 1 ? 's' : ''
        }? This action cannot be undone.`;
      case BulkOperation.ACTIVATE:
        return `Are you sure you want to activate ${count} selected channel${
          count > 1 ? 's' : ''
        }?`;
      case BulkOperation.DEACTIVATE:
        return `Are you sure you want to deactivate ${count} selected channel${
          count > 1 ? 's' : ''
        }?`;
      case BulkOperation.TEST_CONNECTIVITY:
        return `This will test connectivity for ${count} selected channel${
          count > 1 ? 's' : ''
        }. Continue?`;
      default:
        return `Perform this operation on ${count} selected channel${
          count > 1 ? 's' : ''
        }?`;
    }
  }

  private performBulkDelete(channelIds: number[]): void {
    this.tvChannelService
      .bulkDeleteChannels(channelIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.selectedChannels.clear();
          this.bulkOperationsEnabled = false;
          this.loadChannels();
          this.toast.success(
            `Deleted ${channelIds.length} channel${
              channelIds.length > 1 ? 's' : ''
            }`
          );
        },
        error: (error) => {
          console.error('Bulk delete failed:', error);
          this.toast.error(
            `Failed to delete channels: ${error.message || 'Unknown error'}`
          );
        },
      });
  }

  private performBulkStatusChange(
    channelIds: number[],
    isActive: boolean
  ): void {
    console.log(
      `Changing status of channels ${channelIds.join(', ')} to ${
        isActive ? 'active' : 'inactive'
      }`
    );
    this.toast.info('Bulk status change is not yet implemented');
  }

  private performBulkConnectivityTest(channelIds: number[]): void {
    console.log(`Testing connectivity for channels ${channelIds.join(', ')}`);
    this.toast.info('Bulk connectivity test is not yet implemented');
  }

  // Navigation Methods
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

  duplicateChannel(channel: TvChannel): void {
    if (!channel.id) {
      this.toast.error('Cannot duplicate channel: Invalid channel data');
      return;
    }

    // Navigate to add form with duplication parameters
    this.router.navigate(['/channels/add'], {
      queryParams: {
        duplicate: 'true',
        sourceId: channel.id,
      },
    });

    // Optional: Show a toast message
    this.toast.info(`Preparing to duplicate "${channel.name}"`);
  }

  // Channel Operations
  async deleteChannel(id?: number): Promise<void> {
    if (!id) return;

    const channel = this.channels.find((c) => c.id === id);
    const channelName = channel?.name || `Channel ${id}`;

    const ok = await this.confirm.open(
      'Delete channel',
      `Are you sure you want to delete "${channelName}"? This action cannot be undone.`,
      'Delete',
      'Cancel'
    );
    if (!ok) return;

    this.tvChannelService
      .deleteChannel(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadChannels();
          this.toast.success(`Channel "${channelName}" deleted`);
        },
        error: (error) => {
          console.error('Error deleting channel:', error);
          this.toast.error(
            `Failed to delete channel: ${error.message || 'Unknown error'}`
          );
        },
      });
  }

  testChannelConnection(channel: TvChannel): void {
    if (!channel.id) return;

    this.tvChannelService
      .testChannelConnectivity(channel.ip, channel.port)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          const message = `Connection test for "${channel.name}": ${result.message}`;
          this.toast.info(message);
        },
        error: (error) => {
          console.error('Connection test failed:', error);
          this.toast.error(
            `Connection test failed: ${error.message || 'Unknown error'}`
          );
        },
      });
  }

  // View and UI Methods
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'table' ? 'grid' : 'table';
  }

  toggleAutoRefresh(): void {
    this.autoRefreshEnabled = !this.autoRefreshEnabled;

    if (this.autoRefreshEnabled) {
      this.autoRefreshTimer$.next();
      this.toast.info('Auto refresh enabled');
    } else {
      this.toast.info('Auto refresh disabled');
    }
  }

  refreshChannels(): void {
    this.tvChannelService.clearCache();
    this.error = null;
    this.loadChannels();
    this.loadChannelStats();
    this.toast.success('Channels refreshed');
  }

  // Export and Import
  exportChannels(): void {
    this.tvChannelService
      .exportChannels('csv')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          this.downloadBlob(
            blob,
            `tv-channels-${new Date().toISOString().split('T')[0]}.csv`
          );
          this.toast.success('Export started');
        },
        error: (error) => {
          console.error('Export failed:', error);
          this.toast.error('Export failed. Please try again.');
        },
      });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  onImportChannels(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    this.tvChannelService
      .importChannels(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.loadChannels();
          this.toast.success(
            `Import completed: ${result.success} imported, ${result.errors.length} errors`
          );
          if (result.errors.length > 0) {
            console.error('Import errors:', result.errors);
          }
        },
        error: (error) => {
          console.error('Import failed:', error);
          this.toast.error(
            'Import failed. Please check the file format and try again.'
          );
        },
      });

    // Reset file input
    target.value = '';
  }

  // Helper Methods
  getCategoryName(categoryId?: number): string {
    if (!categoryId) return '';
    const category = this.categories.find((c) => c.id === categoryId);
    return category?.name || '';
  }

  getLanguageName(languageId?: number): string {
    if (!languageId) return '';
    const language = this.languages.find((l) => l.id === languageId);
    return language ? `${language.name} ` : '';
  }
  getChannelStatus(channel: TvChannel): 'active' | 'inactive' | 'error' {
    // Updated to use 'active' property instead of 'isActive'
    return channel.isActive !== false ? 'active' : 'inactive';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'secondary';
      case 'error':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  formatStreamUrl(channel: TvChannel): string {
    return `rtmp://${channel.ip}:${channel.port}`;
  }

  dismissSuccessMessage(): void {
    this.showSuccessMessage = false;
  }

  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.style.display = 'none';
    }
  }
}
