import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-terminal-detail',
  templateUrl: './terminal-detail.component.html',
  styleUrls: ['./terminal-detail.component.css'],
})
export class TerminalDetailComponent implements OnInit {
  terminal: any = null;
  loading = true;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTerminal(+id);
    }
  }

  loadTerminal(id: number): void {
    setTimeout(() => {
      this.terminal = {
        id: id,
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
      };
      this.loading = false;
    }, 500);
  }

  editTerminal(): void {
    this.router.navigate(['/terminals', this.terminal.id, 'edit']);
  }

  goBack(): void {
    this.router.navigate(['/terminals']);
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      ACTIVE: 'success',
      INACTIVE: 'secondary',
      MAINTENANCE: 'warning',
      OFFLINE: 'danger',
      FAULTY: 'danger',
    };
    return statusMap[status] || 'secondary';
  }

  getDeviceTypeLabel(deviceType: string): string {
    const typeMap: { [key: string]: string } = {
      SET_TOP_BOX: 'Set Top Box',
      SMART_TV: 'Smart TV',
      DESKTOP_PC: 'Desktop PC',
      TABLET: 'Tablet',
      MOBILE: 'Mobile',
      DISPLAY_SCREEN: 'Display Screen',
    };
    return typeMap[deviceType] || deviceType;
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

  pingTerminal(): void {
    console.log('Pinging terminal...');
    // Mock ping functionality
    alert(`Pinged ${this.terminal.terminalId} successfully`);
    this.terminal.lastSeen = new Date();
  }

  rebootTerminal(): void {
    if (
      confirm(`Are you sure you want to reboot ${this.terminal.terminalId}?`)
    ) {
      console.log('Rebooting terminal...');
      this.terminal.status = 'MAINTENANCE';

      // Simulate reboot process
      setTimeout(() => {
        this.terminal.status = 'ACTIVE';
        this.terminal.lastSeen = new Date();
        alert('Terminal rebooted successfully');
      }, 3000);
    }
  }
}
