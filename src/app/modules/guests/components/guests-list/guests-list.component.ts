import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { FormControl } from '@angular/forms';
import {
  Gender,
  Guest,
  GuestSearchDto,
  GuestStatistics,
  LoyaltyLevel,
  PaginatedResponse,
} from 'src/app/core/models/guest.model';
import { GuestService } from 'src/app/core/services/guest.service';
import { ToastService } from 'src/app/shared/components/toast/toast.service';
import { NotificationService } from 'src/app/core/services/notification.service';

interface FilterOptions {
  genders: Array<{ value: Gender; label: string }>;
  loyaltyLevels: Array<{ value: LoyaltyLevel; label: string; class: string }>;
}

@Component({
  selector: 'app-guests-list',
  templateUrl: './guests-list.component.html',
  styleUrls: ['./guests-list.component.css'],
})
export class GuestsListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data properties
  guests: Guest[] = [];
  paginatedResponse: PaginatedResponse<Guest> | null = null;
  statistics: GuestStatistics | null = null;

  // Loading states
  loading$ = this.guestService.loading$;

  // Search and filter controls
  searchControl = new FormControl('');
  nationalityFilter = new FormControl('');
  genderFilter = new FormControl('');
  vipFilter = new FormControl('');
  loyaltyFilter = new FormControl('');
  roomFilter = new FormControl('');

  // Pagination and sorting
  currentPage = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 20, 50];
  sortBy = 'firstName';
  sortDirection = 'asc';

  // Filter options
  filterOptions: FilterOptions;

  // UI state
  showFilters = false;
  selectedGuests = new Set<number>();

  // Enums for template
  LoyaltyLevel = LoyaltyLevel;
  Gender = Gender;

  constructor(
    private guestService: GuestService,
    private router: Router,
    private toastService: ToastService,
    private notificationService: NotificationService
  ) {
    this.filterOptions = {
      genders: this.guestService.getGenderOptions(),
      loyaltyLevels: this.guestService.getLoyaltyLevels(),
    };
  }

  ngOnInit(): void {
    this.initializeComponent();
    this.setupSearchDebouncing();
    this.loadGuestStatistics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeComponent(): void {
    this.loadGuests();
    this.setupFilterSubscriptions();
  }

  private setupSearchDebouncing(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage = 0;
        this.loadGuests();
      });
  }

  private setupFilterSubscriptions(): void {
    [
      this.nationalityFilter,
      this.genderFilter,
      this.vipFilter,
      this.loyaltyFilter,
      this.roomFilter,
    ].forEach((control) => {
      control.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.currentPage = 0;
        this.loadGuests();
      });
    });
  }

  loadGuests(): void {
    const searchDto = this.buildSearchDto();

    if (this.hasActiveFilters()) {
      this.searchGuests(searchDto);
    } else {
      this.loadPaginatedGuests();
    }
  }

  private buildSearchDto(): GuestSearchDto {
    return {
      searchTerm: this.searchControl.value?.trim() || undefined,
      nationality: this.nationalityFilter.value?.trim() || undefined,
      gender: (this.genderFilter.value as Gender) || undefined,
      vipStatus: this.vipFilter.value
        ? this.vipFilter.value === 'true'
        : undefined,
      loyaltyLevel: (this.loyaltyFilter.value as LoyaltyLevel) || undefined,
      roomId: this.roomFilter.value ? Number(this.roomFilter.value) : undefined,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection,
      page: this.currentPage,
      size: this.pageSize,
    };
  }

  hasActiveFilters(): boolean {
    return !!(
      (this.searchControl.value && this.searchControl.value.trim()) ||
      (this.nationalityFilter.value && this.nationalityFilter.value.trim()) ||
      this.genderFilter.value ||
      this.vipFilter.value ||
      this.loyaltyFilter.value ||
      this.roomFilter.value
    );
  }

  private loadPaginatedGuests(): void {
    this.guestService
      .getGuestsPaged(
        this.currentPage,
        this.pageSize,
        this.sortBy,
        this.sortDirection
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PaginatedResponse<Guest>) => {
          this.paginatedResponse = response;
          this.guests = response.content || [];
        },
        error: (error: any) => {
          console.error('Error loading guests:', error);
          this.toastService.error('Failed to load guests', 'Error');
          this.handleError('Failed to load guests');
          // Set empty pagination response on error
          this.paginatedResponse = {
            content: [],
            totalElements: 0,
            totalPages: 0,
            size: this.pageSize,
            number: this.currentPage,
            numberOfElements: 0,
            first: true,
            last: true,
            empty: true,
          };
          this.guests = [];
        },
      });
  }

  private searchGuests(searchDto: GuestSearchDto): void {
    this.guestService
      .searchGuests(searchDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PaginatedResponse<Guest>) => {
          this.paginatedResponse = response;
          this.guests = response.content || [];
        },
        error: (error: any) => {
          console.error('Error searching guests:', error);
          this.toastService.error('Failed to search guests', 'Search Error');
          this.handleError('Failed to search guests');
          // Set empty pagination response on error
          this.paginatedResponse = {
            content: [],
            totalElements: 0,
            totalPages: 0,
            size: this.pageSize,
            number: this.currentPage,
            numberOfElements: 0,
            first: true,
            last: true,
            empty: true,
          };
          this.guests = [];
        },
      });
  }

  private loadGuestStatistics(): void {
    this.guestService
      .getGuestStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => (this.statistics = stats),
        error: (error) => console.error('Error loading statistics:', error),
      });
  }

  // Pagination methods
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadGuests();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
    this.loadGuests();
  }

  // Sorting methods
  onSort(column: string): void {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    this.currentPage = 0;
    this.loadGuests();
  }

  getSortIcon(column: string): string {
    if (this.sortBy !== column) return 'fas fa-sort';
    return this.sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  }

  // Filter methods
  clearFilters(): void {
    this.searchControl.setValue('');
    this.nationalityFilter.setValue('');
    this.genderFilter.setValue('');
    this.vipFilter.setValue('');
    this.loyaltyFilter.setValue('');
    this.roomFilter.setValue('');
    this.currentPage = 0;
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  // Guest actions
  viewGuest(id: number): void {
    this.router.navigate(['/guests', id]);
  }

  editGuest(id: number): void {
    this.router.navigate(['/guests', id, 'edit']);
  }

  addGuest(): void {
    this.router.navigate(['/guests/add']);
  }

  deleteGuest(guest: Guest): void {
    if (
      confirm(
        `Are you sure you want to delete guest ${guest.firstName} ${guest.lastName}?`
      )
    ) {
      this.guestService
        .deleteGuest(guest.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadGuests();
            this.toastService.success(
              `Guest ${guest.firstName} ${guest.lastName} has been deleted successfully`,
              'Guest Deleted'
            );
            this.notificationService.addNotification({
              type: 'info',
              title: 'Guest Deleted',
              message: `${guest.firstName} ${guest.lastName} has been removed from the system`,
            });
          },
          error: (error: any) => {
            console.error('Error deleting guest:', error);
            this.toastService.error(
              `Failed to delete guest ${guest.firstName} ${guest.lastName}`,
              'Delete Failed'
            );
            this.handleError('Failed to delete guest');
          },
        });
    }
  }

  toggleVipStatus(guest: Guest): void {
    const newStatus = !guest.vipStatus;
    const actionText = newStatus ? 'enabled' : 'disabled';

    this.guestService
      .updateVipStatus(guest.id, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedGuest: Guest) => {
          const index = this.guests.findIndex((g) => g.id === guest.id);
          if (index !== -1) {
            this.guests[index] = updatedGuest;
          }

          this.toastService.success(
            `VIP status ${actionText} for ${guest.firstName} ${guest.lastName}`,
            'VIP Status Updated'
          );

          this.notificationService.addNotification({
            type: 'success',
            title: 'VIP Status Changed',
            message: `${guest.firstName} ${guest.lastName} VIP status has been ${actionText}`,
          });
        },
        error: (error: any) => {
          console.error('Error updating VIP status:', error);
          this.toastService.error(
            `Failed to update VIP status for ${guest.firstName} ${guest.lastName}`,
            'Update Failed'
          );
          this.handleError('Failed to update VIP status');
        },
      });
  }

  // Selection methods
  toggleGuestSelection(guestId: number): void {
    if (this.selectedGuests.has(guestId)) {
      this.selectedGuests.delete(guestId);
    } else {
      this.selectedGuests.add(guestId);
    }
  }

  isGuestSelected(guestId: number): boolean {
    return this.selectedGuests.has(guestId);
  }

  selectAllGuests(): void {
    if (this.selectedGuests.size === this.guests.length) {
      this.selectedGuests.clear();
    } else {
      this.guests.forEach((guest) => this.selectedGuests.add(guest.id));
    }
  }

  bulkDeleteSelected(): void {
    if (this.selectedGuests.size === 0) {
      this.toastService.warning(
        'No guests selected for deletion',
        'Selection Required'
      );
      return;
    }

    const confirmMessage = `Are you sure you want to delete ${this.selectedGuests.size} selected guest(s)? This action cannot be undone.`;
    if (confirm(confirmMessage)) {
      const deletePromises = Array.from(this.selectedGuests).map((guestId) =>
        this.guestService.deleteGuest(guestId).toPromise()
      );

      Promise.all(deletePromises)
        .then(() => {
          this.toastService.success(
            `Successfully deleted ${this.selectedGuests.size} guest(s)`,
            'Bulk Delete Complete'
          );

          this.notificationService.addNotification({
            type: 'info',
            title: 'Bulk Delete Completed',
            message: `${this.selectedGuests.size} guests have been removed from the system`,
          });

          this.selectedGuests.clear();
          this.loadGuests();
        })
        .catch((error) => {
          console.error('Error during bulk delete:', error);
          this.toastService.error(
            'Some guests could not be deleted. Please try again.',
            'Bulk Delete Error'
          );
        });
    }
  }

  bulkToggleVipStatus(): void {
    if (this.selectedGuests.size === 0) {
      this.toastService.warning('No guests selected', 'Selection Required');
      return;
    }

    const selectedGuestObjects = this.guests.filter((g) =>
      this.selectedGuests.has(g.id)
    );
    const allVip = selectedGuestObjects.every((g) => g.vipStatus);
    const newVipStatus = !allVip;
    const actionText = newVipStatus
      ? 'grant VIP status to'
      : 'remove VIP status from';

    if (
      confirm(
        `Are you sure you want to ${actionText} ${this.selectedGuests.size} selected guest(s)?`
      )
    ) {
      const updatePromises = Array.from(this.selectedGuests).map((guestId) =>
        this.guestService.updateVipStatus(guestId, newVipStatus).toPromise()
      );

      Promise.all(updatePromises)
        .then(() => {
          this.toastService.success(
            `VIP status updated for ${this.selectedGuests.size} guest(s)`,
            'Bulk Update Complete'
          );

          this.notificationService.addNotification({
            type: 'success',
            title: 'Bulk VIP Update',
            message: `VIP status ${
              newVipStatus ? 'granted to' : 'removed from'
            } ${this.selectedGuests.size} guests`,
          });

          this.selectedGuests.clear();
          this.loadGuests();
        })
        .catch((error) => {
          console.error('Error during bulk VIP update:', error);
          this.toastService.error(
            'Some VIP status updates failed. Please try again.',
            'Bulk Update Error'
          );
        });
    }
  }

  // Utility methods
  getLoyaltyClass(level: LoyaltyLevel): string {
    const loyaltyObj = this.filterOptions.loyaltyLevels.find(
      (l) => l.value === level
    );
    return loyaltyObj ? loyaltyObj.class : 'bronze';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  formatDateTime(date: string): string {
    return new Date(date).toLocaleString();
  }

  getGuestFullName(guest: Guest): string {
    return `${guest.firstName} ${guest.lastName}`;
  }

  getRoomInfo(guest: Guest): string {
    if (!guest.room) return 'No room assigned';
    return `Room ${guest.room.roomNumber} (Floor ${guest.room.floorNumber})`;
  }

  // Error handling
  private handleError(message: string): void {
    // Error is already logged by individual methods, this is for additional handling if needed
    console.error(message);
  }

  // Loading states
  isLoading(): boolean {
    return false; // Loading is handled by the loading$ observable
  }

  // Enhanced refresh functionality
  refreshGuestList(): void {
    this.toastService.info('Refreshing guest list...', 'Refresh');
    this.loadGuests();
  }

  // Export functionality (placeholder for future implementation)
  exportGuestList(): void {
    const exportData = this.guests.map((guest) => ({
      'Guest ID': guest.pmsGuestId,
      'First Name': guest.firstName,
      'Last Name': guest.lastName,
      Email: guest.email || '',
      Phone: guest.phone || '',
      Nationality: guest.nationality || '',
      'VIP Status': guest.vipStatus ? 'Yes' : 'No',
      'Loyalty Level': guest.loyaltyLevel,
      Room: guest.room ? guest.room.roomNumber : 'Unassigned',
      'Created Date': this.formatDate(guest.createdAt),
    }));

    // Convert to CSV (basic implementation)
    const csvContent = this.convertToCSV(exportData);
    this.downloadCSV(csvContent, 'guests-export.csv');

    this.toastService.success(
      'Guest list exported successfully',
      'Export Complete'
    );
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',')
              ? `"${value}"`
              : value;
          })
          .join(',')
      ),
    ];

    return csvRows.join('\n');
  }

  private downloadCSV(csvContent: string, fileName: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Template helpers
  get totalGuests(): number {
    return this.paginatedResponse?.totalElements || 0;
  }

  get hasGuests(): boolean {
    return this.guests.length > 0;
  }

  get hasNextPage(): boolean {
    return this.paginatedResponse ? !this.paginatedResponse.last : false;
  }

  get hasPreviousPage(): boolean {
    return this.paginatedResponse ? !this.paginatedResponse.first : false;
  }

  get currentPageDisplay(): number {
    return (this.paginatedResponse?.number || 0) + 1;
  }

  get totalPages(): number {
    return this.paginatedResponse?.totalPages || 1;
  }

  // Track by function for better performance
  trackByGuestId(index: number, guest: Guest): number {
    return guest.id;
  }

  // Pagination page numbers calculation
  getPaginationPages(): (number | string)[] {
    const totalPages = this.totalPages;
    const current = this.currentPageDisplay;
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (current > 4) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, current - 1);
      const end = Math.min(totalPages - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < totalPages - 3) {
        pages.push('...');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  }

  // Math reference for template
  Math = Math;
}
