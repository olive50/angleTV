import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { ConfirmService } from '../../../../shared/components/confirm/confirm.service';

export interface Terminal {
  id: number;
  terminalId: string;
  deviceType:
    | 'SET_TOP_BOX'
    | 'SMART_TV'
    | 'DESKTOP_PC'
    | 'TABLET'
    | 'MOBILE'
    | 'DISPLAY_SCREEN';
  brand: string;
  model: string;
  macAddress: string;
  ipAddress: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'OFFLINE' | 'FAULTY';
  location: string;
  room?: { id: number; roomNumber: string };
  lastSeen: Date;
  firmwareVersion?: string;
  serialNumber?: string;
}

@Component({
  selector: 'app-terminals-list',
  templateUrl: './terminals-list.component.html',
  styleUrls: ['./terminals-list.component.css'],
})
export class TerminalsListComponent implements OnInit {
  terminals: Terminal[] = [
    {
      id: 1,
      terminalId: 'STB001',
      deviceType: 'SET_TOP_BOX',
      brand: 'Samsung',
      model: 'SMT-C7140',
      macAddress: '00:1A:2B:3C:4D:5E',
      ipAddress: '192.168.1.101',
      status: 'ACTIVE',
      location: 'Room 101',
      room: { id: 1, roomNumber: '101' },
      lastSeen: new Date(),
      firmwareVersion: '2.1.5',
      serialNumber: 'SN001234567',
    },
    {
      id: 2,
      terminalId: 'STB002',
      deviceType: 'SET_TOP_BOX',
      brand: 'LG',
      model: 'ST600S',
      macAddress: '00:1A:2B:3C:4D:5F',
      ipAddress: '192.168.1.102',
      status: 'ACTIVE',
      location: 'Room 102',
      room: { id: 2, roomNumber: '102' },
      lastSeen: new Date(Date.now() - 5 * 60 * 1000),
      firmwareVersion: '1.9.2',
      serialNumber: 'SN001234568',
    },
    {
      id: 3,
      terminalId: 'TV001',
      deviceType: 'SMART_TV',
      brand: 'Sony',
      model: 'KD-55X80K',
      macAddress: '00:1A:2B:3C:4D:60',
      ipAddress: '192.168.1.201',
      status: 'OFFLINE',
      location: 'Room 201',
      room: { id: 3, roomNumber: '201' },
      lastSeen: new Date(Date.now() - 30 * 60 * 1000),
      firmwareVersion: '8.0.1',
      serialNumber: 'TV001234569',
    },
    {
      id: 4,
      terminalId: 'TAB001',
      deviceType: 'TABLET',
      brand: 'iPad',
      model: 'Pro 12.9',
      macAddress: '00:1A:2B:3C:4D:61',
      ipAddress: '192.168.1.151',
      status: 'ACTIVE',
      location: 'Lobby',
      lastSeen: new Date(Date.now() - 2 * 60 * 1000),
      firmwareVersion: '16.5.1',
      serialNumber: 'TB001234570',
    },
    {
      id: 5,
      terminalId: 'STB003',
      deviceType: 'SET_TOP_BOX',
      brand: 'Huawei',
      model: 'EC6108V9',
      macAddress: '00:1A:2B:3C:4D:62',
      ipAddress: '192.168.1.103',
      status: 'MAINTENANCE',
      location: 'Room 103',
      room: { id: 4, roomNumber: '103' },
      lastSeen: new Date(Date.now() - 60 * 60 * 1000),
      firmwareVersion: '3.2.1',
      serialNumber: 'SN001234571',
    },
    {
      id: 6,
      terminalId: 'DSP001',
      deviceType: 'DISPLAY_SCREEN',
      brand: 'Samsung',
      model: 'QM85R',
      macAddress: '00:1A:2B:3C:4D:63',
      ipAddress: '192.168.1.210',
      status: 'ACTIVE',
      location: 'Conference Room A',
      lastSeen: new Date(Date.now() - 10 * 60 * 1000),
      firmwareVersion: '1.4.3',
      serialNumber: 'DS001234572',
    },
  ];

  filteredTerminals = [...this.terminals];
  searchTerm = '';
  statusFilter = '';
  deviceTypeFilter = '';
  locationFilter = '';
  loading = false;

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

  locations = [
    'Room 101',
    'Room 102',
    'Room 103',
    'Room 201',
    'Room 202',
    'Room 203',
    'Lobby',
    'Conference Room A',
    'Conference Room B',
    'Restaurant',
    'Bar',
  ];

  constructor(private router: Router, private toast: ToastService, private confirm: ConfirmService) {}

  ngOnInit(): void {
    this.applyFilters();
  }

  onSearch(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredTerminals = this.terminals.filter((terminal) => {
      const matchesSearch =
        !this.searchTerm ||
        terminal.terminalId
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase()) ||
        terminal.brand.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        terminal.model.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        terminal.location
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase()) ||
        terminal.macAddress
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase()) ||
        terminal.ipAddress.includes(this.searchTerm);

      const matchesStatus =
        !this.statusFilter || terminal.status === this.statusFilter;
      const matchesDeviceType =
        !this.deviceTypeFilter || terminal.deviceType === this.deviceTypeFilter;
      const matchesLocation =
        !this.locationFilter || terminal.location.includes(this.locationFilter);

      return (
        matchesSearch && matchesStatus && matchesDeviceType && matchesLocation
      );
    });
  }

  getStatusClass(status: string): string {
    const statusObj = this.statuses.find((s) => s.value === status);
    return statusObj ? statusObj.class : 'secondary';
  }

  getDeviceTypeLabel(deviceType: string): string {
    const deviceObj = this.deviceTypes.find((d) => d.value === deviceType);
    return deviceObj ? deviceObj.label : deviceType;
  }

  getDeviceIcon(deviceType: string): string {
    const deviceObj = this.deviceTypes.find((d) => d.value === deviceType);
    return deviceObj ? deviceObj.icon : 'fas fa-desktop';
  }

  getLastSeenText(lastSeen: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  getLastSeenClass(lastSeen: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 5) return 'text-success';
    if (diffMins < 30) return 'text-warning';
    return 'text-danger';
  }

  viewTerminal(id: number): void {
    this.router.navigate(['/terminals', id]);
  }

  editTerminal(id: number): void {
    this.router.navigate(['/terminals', id, 'edit']);
  }

  async deleteTerminal(id: number): Promise<void> {
    const ok = await this.confirm.open(
      'Delete terminal',
      'Are you sure you want to delete this terminal? This action cannot be undone.',
      'Delete',
      'Cancel'
    );
    if (!ok) return;

    this.terminals = this.terminals.filter((t) => t.id !== id);
    this.applyFilters();
    // TODO: Call API to delete terminal
    this.toast.success('Terminal deleted');
  }

  changeTerminalStatus(id: number, newStatus: string): void {
    const terminal = this.terminals.find((t) => t.id === id);
    if (terminal) {
      terminal.status = newStatus as any;
      terminal.lastSeen = new Date();
      this.applyFilters();
      // TODO: Call API to update terminal status
      this.toast.success('Terminal status updated');
    }
  }

  addTerminal(): void {
    this.router.navigate(['/terminals/add']);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.deviceTypeFilter = '';
    this.locationFilter = '';
    this.applyFilters();
    this.toast.info('Filters cleared');
  }

  exportTerminals(): void {
    console.log('Exporting terminals...', this.filteredTerminals);
    this.toast.info('Export functionality will be implemented');
  }

  refreshData(): void {
    this.loading = true;
    // TODO: Call API to refresh data
    setTimeout(() => {
      this.loading = false;
      // Update lastSeen for active terminals
      this.terminals.forEach((terminal) => {
        if (terminal.status === 'ACTIVE') {
          terminal.lastSeen = new Date();
        }
      });
      this.applyFilters();
      this.toast.success('Data refreshed');
    }, 1000);
  }

  getTerminalStats() {
    return {
      total: this.terminals.length,
      active: this.terminals.filter((t) => t.status === 'ACTIVE').length,
      offline: this.terminals.filter((t) => t.status === 'OFFLINE').length,
      maintenance: this.terminals.filter((t) => t.status === 'MAINTENANCE')
        .length,
      faulty: this.terminals.filter((t) => t.status === 'FAULTY').length,
    };
  }

  pingTerminal(id: number): void {
    const terminal = this.terminals.find((t) => t.id === id);
    if (terminal) {
      // TODO: Implement ping functionality
      terminal.lastSeen = new Date();
      this.applyFilters();
      this.toast.success(`Pinged ${terminal.terminalId} successfully`);
    }
  }

  async rebootTerminal(id: number): Promise<void> {
    const terminal = this.terminals.find((t) => t.id === id);
    if (!terminal) return;

    const ok = await this.confirm.open('Reboot terminal', `Are you sure you want to reboot ${terminal.terminalId}?`, 'Reboot', 'Cancel');
    if (!ok) return;

    // TODO: Implement reboot functionality
    terminal.status = 'MAINTENANCE';
    this.applyFilters();

    // Simulate reboot process
    setTimeout(() => {
      terminal.status = 'ACTIVE';
      terminal.lastSeen = new Date();
      this.applyFilters();
      this.toast.success(`${terminal.terminalId} rebooted`);
    }, 3000);
  }
}
