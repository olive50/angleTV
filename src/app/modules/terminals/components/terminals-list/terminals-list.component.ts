import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  takeUntil,
  finalize,
} from 'rxjs';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { ConfirmService } from '../../../../shared/components/confirm/confirm.service';
import {
  PaginationData,
  Terminal,
  TerminalSearchCriteria,
  TerminalStats,
  DeviceType,
  TerminalStatus,
} from 'src/app/core/models/terminal.model';
import { TerminalService } from 'src/app/core/services/Terminal.service';

@Component({
  selector: 'app-terminals-list',
  templateUrl: './terminals-list.component.html',
  styleUrls: ['./terminals-list.component.css'],
})
export class TerminalsListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Data properties
  terminals: Terminal[] = [];
  terminalStats: TerminalStats | null = null;
  pagination: PaginationData = {
    page: 0,
    size: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  };

  // UI state
  loading = false;
  refreshing = false;
  error: string | null = null;

  // Filter properties
  searchTerm = '';
  statusFilter = '';
  deviceTypeFilter = '';
  locationFilter = '';
  roomFilter = '';

  // Sorting
  sortField = 'terminalCode';
  sortDirection = 'asc';

  // Options
  deviceTypes = [
    { value: 'SET_TOP_BOX', label: 'Set Top Box', icon: 'fas fa-tv' },
    { value: 'SMART_TV', label: 'Smart TV', icon: 'fas fa-television' },
    { value: 'DESKTOP_PC', label: 'Desktop PC', icon: 'fas fa-desktop' },
    { value: 'TABLET', label: 'Tablet', icon: 'fas fa-tablet-alt' },
    { value: 'MOBILE', label: 'Mobile', icon: 'fas fa-mobile-alt' },
    {
      value: 'DISPLAY_SCREEN',
      label: 'Display Screen',
      icon: 'fas fa-monitor',
    },
  ];

  statuses = [
    { value: 'ACTIVE', label: 'Active', class: 'success' },
    { value: 'INACTIVE', label: 'Inactive', class: 'secondary' },
    { value: 'MAINTENANCE', label: 'Maintenance', class: 'warning' },
    { value: 'OFFLINE', label: 'Offline', class: 'danger' },
    { value: 'FAULTY', label: 'Faulty', class: 'danger' },
  ];

  locations: string[] = [];
  rooms: { id: number; roomNumber: string }[] = [];

  // Pagination
  pageSizeOptions = [10, 20, 50, 100];
  Math = Math;

  constructor(
    private router: Router,
    private toast: ToastService,
    private confirm: ConfirmService,
    private terminalService: TerminalService
  ) {}

  ngOnInit(): void {
    this.initializeSearchDebounce();
    this.loadTerminals();
    this.loadTerminalStats();
    this.subscribeToTerminalUpdates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeSearchDebounce(): void {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.pagination.page = 0;
        this.loadTerminals();
      });
  }

  private subscribeToTerminalUpdates(): void {
    this.terminalService.terminals$
      .pipe(takeUntil(this.destroy$))
      .subscribe((terminals) => {
        this.updateFilterOptions(terminals);
      });

    this.terminalService.stats$
      .pipe(takeUntil(this.destroy$))
      .subscribe((stats) => {
        this.terminalStats = stats;
      });
  }

  private updateFilterOptions(terminals: any[]): void {
    this.locations = [...new Set(terminals.map((t) => t.location))].sort();

    const uniqueRooms = terminals
      .filter((t) => t.room)
      .map((t) => t.room!)
      .filter(
        (room, index, array) =>
          array.findIndex((r) => r.id === room.id) === index
      );
    this.rooms = uniqueRooms.sort((a, b) =>
      a.roomNumber.localeCompare(b.roomNumber)
    );
  }

  loadTerminals(): void {
    if (this.loading) return;

    this.loading = true;
    this.error = null;

    const criteria: TerminalSearchCriteria = {
      search: this.searchTerm || undefined,
      status: this.statusFilter || undefined,
      deviceType: this.deviceTypeFilter || undefined,
      location: this.locationFilter || undefined,
      roomId: this.roomFilter ? parseInt(this.roomFilter) : undefined,
    };

    this.terminalService
      .getTerminalsPaged(
        this.pagination.page,
        this.pagination.size,
        this.sortField,
        this.sortDirection,
        criteria
      )
      .pipe(
        finalize(() => (this.loading = false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          this.terminals = response.terminals as Terminal[];
          this.pagination = response.pagination;
          this.updateFilterOptions(this.terminals);
        },
        error: (error) => {
          this.error = error.message;
          this.toast.error('Failed to load terminals: ' + error.message);
          console.error('Error loading terminals:', error);
        },
      });
  }

  loadTerminalStats(): void {
    this.terminalService
      .getTerminalStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.terminalStats = stats;
        },
        error: (error) => {
          console.error('Error loading terminal stats:', error);
        },
      });
  }

  onSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onFilterChange(): void {
    this.pagination.page = 0;
    this.loadTerminals();
  }

  onSortChange(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.pagination.page = 0;
    this.loadTerminals();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.deviceTypeFilter = '';
    this.locationFilter = '';
    this.roomFilter = '';
    this.pagination.page = 0;
    this.loadTerminals();
    this.toast.info('Filters cleared');
  }

  onPageChange(page: number): void {
    this.pagination.page = page;
    this.loadTerminals();
  }

  onPageSizeChange(size: number): void {
    this.pagination.size = size;
    this.pagination.page = 0;
    this.loadTerminals();
  }

  viewTerminal(id: number): void {
    this.router.navigate(['/terminals', id]);
  }

  editTerminal(id: number): void {
    this.router.navigate(['/terminals', id, 'edit']);
  }

  addTerminal(): void {
    this.router.navigate(['/terminals/add']);
  }

  async deleteTerminal(id: number): Promise<void> {
    const terminal = this.terminals.find((t) => t.id === id);
    if (!terminal) return;

    const confirmed = await this.confirm.open(
      'Delete Terminal',
      `Are you sure you want to delete terminal "${terminal.terminalCode}"? This action cannot be undone.`,
      'Delete',
      'Cancel'
    );

    if (!confirmed) return;

    this.terminalService
      .deleteTerminal(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success(
            `Terminal "${terminal.terminalCode}" deleted successfully`
          );
          this.loadTerminals();
          this.loadTerminalStats();
        },
        error: (error) => {
          this.toast.error('Failed to delete terminal: ' + error.message);
          console.error('Error deleting terminal:', error);
        },
      });
  }

  async rebootTerminal(id: number): Promise<void> {
    const terminal = this.terminals.find((t) => t.id === id);
    if (!terminal) return;

    const confirmed = await this.confirm.open(
      'Reboot Terminal',
      `Are you sure you want to reboot "${terminal.terminalCode}"? This will temporarily interrupt service.`,
      'Reboot',
      'Cancel'
    );

    if (!confirmed) return;

    this.terminalService
      .rebootTerminal(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success(
            `Terminal "${terminal.terminalCode}" reboot initiated`
          );
          setTimeout(() => {
            this.loadTerminals();
          }, 1000);
        },
        error: (error) => {
          this.toast.error('Failed to reboot terminal: ' + error.message);
          console.error('Error rebooting terminal:', error);
        },
      });
  }

  pingTerminal(id: number): void {
    const terminal = this.terminals.find((t) => t.id === id);
    if (!terminal) return;

    this.terminalService
      .testTerminalConnectivity(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.toast.success(
              `Terminal "${terminal.terminalCode}" is reachable`
            );
          } else {
            this.toast.warning(
              `Terminal "${terminal.terminalCode}" is not responding: ${result.message}`
            );
          }
          this.loadTerminals();
        },
        error: (error) => {
          this.toast.error('Failed to ping terminal: ' + error.message);
          console.error('Error pinging terminal:', error);
        },
      });
  }

  authorizeDevice(id: number): void {
    const terminal = this.terminals.find((t) => t.id === id);
    if (!terminal) return;

    this.terminalService
      .authorizeDevice(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success(
            `Device "${terminal.terminalCode}" authorized successfully`
          );
          this.loadTerminals();
        },
        error: (error) => {
          this.toast.error('Failed to authorize device: ' + error.message);
          console.error('Error authorizing device:', error);
        },
      });
  }

  refreshData(): void {
    this.refreshing = true;

    Promise.all([
      this.terminalService.getAllTerminals().toPromise(),
      this.terminalService.getTerminalStatistics().toPromise(),
    ])
      .then(() => {
        this.loadTerminals();
        this.toast.success('Data refreshed successfully');
      })
      .catch((error) => {
        this.toast.error('Failed to refresh data: ' + error.message);
        console.error('Error refreshing data:', error);
      })
      .finally(() => {
        this.refreshing = false;
      });
  }

  exportTerminals(): void {
    const headers = [
      'Terminal Code',
      'Device Type',
      'Brand',
      'Model',
      'MAC Address',
      'IP Address',
      'Status',
      'Location',
      'Room',
      'Last Seen',
      'Firmware Version',
      'Serial Number',
    ];

    const csvContent = [
      headers.join(','),
      ...this.terminals.map((terminal) =>
        [
          terminal.terminalCode || '',
          this.getDeviceTypeLabel(terminal.deviceType),
          terminal.brand || '',
          terminal.model || '',
          terminal.macAddress || '',
          terminal.ipAddress || '',
          terminal.status || '',
          terminal.location || '',
          terminal.room?.roomNumber || '',
          new Date(terminal.lastSeen).toLocaleString(),
          terminal.firmwareVersion || '',
          terminal.serialNumber || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `terminals-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.toast.success('Terminals exported successfully');
  }

  getStatusClass(status: string): string {
    const statusObj = this.statuses.find((s) => s.value === status);
    return statusObj ? statusObj.class : 'secondary';
  }

  getDeviceTypeLabel(deviceType?: DeviceType): string {
    if (!deviceType) return 'Unknown';
    const deviceObj = this.deviceTypes.find((d) => d.value === deviceType);
    return deviceObj ? deviceObj.label : deviceType.toString();
  }

  getDeviceIcon(deviceType?: DeviceType): string {
    if (!deviceType) return 'fas fa-question-circle';
    const deviceObj = this.deviceTypes.find((d) => d.value === deviceType);
    return deviceObj ? deviceObj.icon : 'fas fa-desktop';
  }

  getLastSeenText(lastSeen: string): string {
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  getLastSeenClass(lastSeen: string): string {
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 5) return 'text-success';
    if (diffMins < 30) return 'text-warning';
    return 'text-danger';
  }

  getTerminalStats(): TerminalStats {
    return (
      this.terminalStats || {
        total: 0,
        active: 0,
        inactive: 0,
        offline: 0,
        maintenance: 0,
        faulty: 0,
        byDeviceType: {},
        byLocation: {},
      }
    );
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return 'fas fa-sort';
    return this.sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  }

  isTerminalActionDisabled(terminal: Terminal, action: string): boolean {
    switch (action) {
      case 'ping':
      case 'reboot':
        return (
          terminal.status === TerminalStatus.OFFLINE ||
          terminal.status === TerminalStatus.FAULTY
        );
      case 'authorize':
        return terminal.status === TerminalStatus.MAINTENANCE;
      default:
        return false;
    }
  }

  getUptimeDisplay(uptime?: number): string {
    if (uptime === undefined || uptime === null) return 'N/A';
    return `${uptime.toFixed(1)}%`;
  }

  getUptimeClass(uptime?: number): string {
    if (uptime === undefined || uptime === null) return '';
    if (uptime >= 99) return 'text-success';
    if (uptime >= 95) return 'text-warning';
    return 'text-danger';
  }

  getVisiblePages(): number[] {
    const totalPages = this.pagination.totalPages;
    const currentPage = this.pagination.page;
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    const half = Math.floor(maxVisible / 2);
    let start = Math.max(0, currentPage - half);
    let end = Math.min(totalPages - 1, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(0, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }
}
