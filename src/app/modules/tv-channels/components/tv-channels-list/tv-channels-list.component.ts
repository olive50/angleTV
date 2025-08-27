import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tv-channels-list',
  templateUrl: './tv-channels-list.component.html',
  styleUrls: ['./tv-channels-list.component.css'],
})
export class TvChannelsListComponent implements OnInit {
  channels: any[] = [];
  categories: any[] = [];
  languages: any[] = [];
  loading = false;
  searchTerm = '';
  selectedCategoryId: number | null = null;
  selectedLanguageId: number | null = null;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadLanguages();
    this.loadChannels();
  }

  loadChannels(): void {
    this.loading = true;
    setTimeout(() => {
      this.channels = [
        {
          id: 1,
          channelNumber: 101,
          name: 'CNN International',
          description: 'International news channel',
          ip: '192.168.1.100',
          port: 8001,
          logoUrl: 'https://example.com/cnn-logo.png',
          category: { id: 1, name: 'News' },
          language: { id: 1, name: 'English', code: 'EN' },
        },
      ];
      this.loading = false;
    }, 500);
  }

  loadCategories(): void {
    this.categories = [
      { id: 1, name: 'News' },
      { id: 2, name: 'Sports' },
      { id: 3, name: 'Entertainment' },
    ];
  }

  loadLanguages(): void {
    this.languages = [
      { id: 1, name: 'English', code: 'EN' },
      { id: 2, name: 'Arabic', code: 'AR' },
      { id: 3, name: 'French', code: 'FR' },
    ];
  }

  onFilterChange(): void {
    this.loadChannels();
  }

  onSearchChange(): void {
    this.loadChannels();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategoryId = null;
    this.selectedLanguageId = null;
    this.loadChannels();
  }

  deleteChannel(id: number): void {
    if (confirm('Are you sure?')) {
      this.channels = this.channels.filter((c) => c.id !== id);
    }
  }

  addChannel(): void {
    this.router.navigate(['/channels/add']);
  }
}
