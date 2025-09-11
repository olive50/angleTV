// src/app/modules/tv-channels/components/tv-channel-detail/tv-channel-detail.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { TvChannelService } from '../../../../core/services/tv-channel.service';
import { TvChannel } from '../../../../core/models/tv-channel.model';
import { ConfirmService } from '../../../../shared/components/confirm/confirm.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-tv-channel-detail',
  templateUrl: './tv-channel-detail.component.html',
  styleUrls: ['./tv-channel-detail.component.css'],
})
export class TvChannelDetailComponent implements OnInit, OnDestroy {
  channel: TvChannel | null = null;
  loading = true;
  error: string | null = null;
  testingConnection = false;
  connectionResult: { success: boolean; message: string } | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tvChannelService: TvChannelService,
    private confirm: ConfirmService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadChannel();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadChannel(): void {
    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          const id = +params['id'];
          if (!id || isNaN(id)) {
            this.router.navigate(['/channels']);
            return [];
          }
          this.loading = true;
          this.error = null;
          return this.tvChannelService.getChannelById(id);
        })
      )
      .subscribe({
        next: (channel) => {
          this.channel = channel;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading channel:', error);
          this.error = error.message || 'Failed to load channel details';
          this.loading = false;
          // this.toast.error(this.error);
          this.toast.error(this.error ?? '');
        },
      });
  }

  testConnection(): void {
    if (!this.channel) return;

    this.testingConnection = true;
    this.connectionResult = null;

    this.tvChannelService
      .testChannelConnectivity(this.channel.ip, this.channel.port)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.connectionResult = result;
          this.testingConnection = false;
          this.toast.info(result.message);
        },
        error: (error) => {
          console.error('Connection test failed:', error);
          this.connectionResult = {
            success: false,
            message: 'Connection test failed',
          };
          this.testingConnection = false;
          this.toast.error('Connection test failed');
        },
      });
  }

  editChannel(): void {
    if (this.channel?.id) {
      this.router.navigate(['/channels', this.channel.id, 'edit']);
    }
  }

  async deleteChannel(): Promise<void> {
    if (!this.channel?.id) return;

    const confirmMessage = `Are you sure you want to delete channel "${this.channel.name}"?\n\nThis action cannot be undone and will permanently remove the channel from your IPTV system.`;

    const ok = await this.confirm.open('Delete channel', confirmMessage, 'Delete', 'Cancel');
    if (!ok) return;

    this.loading = true;
    this.tvChannelService
      .deleteChannel(this.channel.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const name = this.channel?.name;
          this.router.navigate(['/channels'], {
            queryParams: {
              message: `Channel "${name}" deleted successfully`,
            },
          });
          this.toast.success(`Channel "${name}" deleted`);
        },
        error: (error) => {
          console.error('Error deleting channel:', error);
          this.loading = false;
          this.toast.error(`Failed to delete channel: ${error.message || 'Unknown error'}`);
        },
      });
  }

  duplicateChannel(): void {
    if (!this.channel) return;

    const newChannelNumber = this.getNextAvailableChannelNumber();
    const duplicatedChannel = {
      ...this.channel,
      id: undefined,
      channelNumber: newChannelNumber,
      name: `${this.channel.name} (Copy)`,
    };

    this.router.navigate(['/channels/add'], {
      queryParams: {
        duplicate: 'true',
        data: JSON.stringify(duplicatedChannel),
      },
    });
    this.toast.info('Duplicated channel, ready to edit');
  }

  private getNextAvailableChannelNumber(): number {
    // In a real implementation, this would check against existing channels
    return (this.channel?.channelNumber || 100) + 1;
  }

  goBack(): void {
    this.router.navigate(['/channels']);
  }

  refreshChannel(): void {
    this.loadChannel();
    this.toast.success('Channel refreshed');
  }

  // Helper methods for template
  getChannelStatus(): 'active' | 'inactive' {
    // Determine channel status based on your business logic
    return 'active';
  }

  getStatusClass(): string {
    const status = this.getChannelStatus();
    return status === 'active' ? 'success' : 'secondary';
  }

  getStatusIcon(): string {
    const status = this.getChannelStatus();
    return status === 'active' ? 'fa-circle' : 'fa-circle';
  }

  formatStreamUrl(): string {
    if (!this.channel) return '';
    return `rtmp://${this.channel.ip}:${this.channel.port}`;
  }

  copyToClipboard(text: string): void {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          this.toast.success('Copied to clipboard');
        })
        .catch(() => {
          this.fallbackCopyToClipboard(text);
        });
    } else {
      this.fallbackCopyToClipboard(text);
    }
  }

  private fallbackCopyToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      this.toast.success('Copied to clipboard');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      this.toast.error('Failed to copy');
    }

    document.body.removeChild(textArea);
  }

  hasLogo(): boolean {
    return !!this.channel?.logoUrl;
  }

  getLogoAlt(): string {
    return this.channel?.name ? `${this.channel.name} logo` : 'Channel logo';
  }
  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.style.display = 'none';
    }
  }
}
