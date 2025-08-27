import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-tv-channel-detail',
  templateUrl: './tv-channel-detail.component.html',
  styleUrls: ['./tv-channel-detail.component.css'],
})
export class TvChannelDetailComponent implements OnInit {
  channel: any = null;
  loading = true;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadChannel(+id);
    }
  }

  loadChannel(id: number): void {
    // Mock data
    setTimeout(() => {
      this.channel = {
        id: id,
        channelNumber: 101,
        name: 'CNN International',
        description: 'International news channel',
        ip: '192.168.1.100',
        port: 8001,
        logoUrl: 'https://example.com/cnn-logo.png',
        category: { id: 1, name: 'News' },
        language: { id: 1, name: 'English', code: 'EN' },
      };
      this.loading = false;
    }, 500);
  }

  editChannel(): void {
    this.router.navigate(['/channels', this.channel.id, 'edit']);
  }

  deleteChannel(): void {
    if (confirm('Are you sure you want to delete this channel?')) {
      this.router.navigate(['/channels']);
    }
  }

  goBack(): void {
    this.router.navigate(['/channels']);
  }
}
