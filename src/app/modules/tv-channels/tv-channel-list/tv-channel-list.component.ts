import { Component, OnInit } from '@angular/core';
import { TvChannelService } from '../../../core/services/tv-channel.service';
import { TvChannelCategoryService } from '../../../core/services/tv-channel-category.service';
import { LanguageService } from '../../../core/services/language.service';
import { TvChannel, PagedResponse } from '../../models/tv-channel.model';
import { TvChannelCategory } from '../../models/tv-channel-category.model';
import { Language } from '../../models/language.model';

@Component({
  selector: 'app-tv-channel-list',
  templateUrl: './tv-channel-list.component.html',
  styleUrls: ['./tv-channel-list.component.css'],
})
export class TvChannelListComponent implements OnInit {
  channels: TvChannel[] = [];
  pagedChannels: PagedResponse<TvChannel> | null = null;
  categories: TvChannelCategory[] = [];
  languages: Language[] = [];

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;

  // Filtering
  selectedCategoryId: number | null = null;
  selectedLanguageId: number | null = null;
  searchTerm = '';

  // Sorting
  sortBy = 'channelNumber';
  sortDirection = 'asc';

  loading = false;

  constructor(
    private tvChannelService: TvChannelService,
    private categoryService: TvChannelCategoryService,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadLanguages();
    this.loadChannels();
  }

  loadChannels(): void {
    this.loading = true;

    if (this.searchTerm) {
      this.searchChannels();
      return;
    }

    if (this.selectedCategoryId) {
      this.loadChannelsByCategory();
      return;
    }

    if (this.selectedLanguageId) {
      this.loadChannelsByLanguage();
      return;
    }

    this.tvChannelService
      .getChannelsPaged(
        this.currentPage,
        this.pageSize,
        this.sortBy,
        this.sortDirection
      )
      .subscribe({
        next: (data) => {
          this.pagedChannels = data;
          this.channels = data.content;
          this.totalElements = data.totalElements;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading channels:', error);
          this.loading = false;
        },
      });
  }

  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (data) => (this.categories = data),
      error: (error) => console.error('Error loading categories:', error),
    });
  }

  loadLanguages(): void {
    this.languageService.getAllLanguages().subscribe({
      next: (data) => (this.languages = data),
      error: (error) => console.error('Error loading languages:', error),
    });
  }

  loadChannelsByCategory(): void {
    if (!this.selectedCategoryId) return;

    this.tvChannelService
      .getChannelsByCategory(this.selectedCategoryId)
      .subscribe({
        next: (data) => {
          this.channels = data;
          this.pagedChannels = null;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading channels by category:', error);
          this.loading = false;
        },
      });
  }

  loadChannelsByLanguage(): void {
    if (!this.selectedLanguageId) return;

    this.tvChannelService
      .getChannelsByLanguage(this.selectedLanguageId)
      .subscribe({
        next: (data) => {
          this.channels = data;
          this.pagedChannels = null;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading channels by language:', error);
          this.loading = false;
        },
      });
  }

  searchChannels(): void {
    if (!this.searchTerm.trim()) {
      this.loadChannels();
      return;
    }

    this.tvChannelService
      .searchChannels(this.searchTerm, this.currentPage, this.pageSize)
      .subscribe({
        next: (data) => {
          this.pagedChannels = data;
          this.channels = data.content;
          this.totalElements = data.totalElements;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error searching channels:', error);
          this.loading = false;
        },
      });
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadChannels();
  }

  onSearchChange(): void {
    this.currentPage = 0;
    this.selectedCategoryId = null;
    this.selectedLanguageId = null;
    this.loadChannels();
  }

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

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadChannels();
  }

  deleteChannel(id: number): void {
    if (confirm('Are you sure you want to delete this channel?')) {
      this.tvChannelService.deleteChannel(id).subscribe({
        next: () => {
          this.loadChannels();
        },
        error: (error) => {
          console.error('Error deleting channel:', error);
        },
      });
    }
  }

  clearFilters(): void {
    this.selectedCategoryId = null;
    this.selectedLanguageId = null;
    this.searchTerm = '';
    this.currentPage = 0;
    this.loadChannels();
  }
}
