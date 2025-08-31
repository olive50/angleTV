// src/app/modules/tv-channels/components/tv-channels-list/tv-channels-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, combineLatest, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TvChannelService, ChannelFilters } from '../../../../core/services/tv-channel.service';
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
  channels: TvChannel[] = [];
  categories: TvChannelCategory[] = [];
  languages: Language[] = [];
  
  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;
  
  // Filtres
  filters: ChannelFilters = {};
  searchTerm = '';
  selectedCategoryId: number | null = null;
  selectedLanguageId: number | null = null;
  
  // États
  loading$ = this.tvChannelService.loading$;
  error: string | null = null;
  
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private tvChannelService: TvChannelService,
    private languageService: LanguageService,
    private categoryService: TvChannelCategoryService,
    private router: Router
  ) {
    // Configuration de la recherche avec debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.applyFilters();
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData(): void {
    // Charger toutes les données nécessaires en parallèle
    combineLatest([
      this.categoryService.getAllCategories(),
      this.languageService.getAllLanguages()
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
        this.error = 'Failed to load initial data';
      }
    });
  }

  private loadChannels(): void {
    this.tvChannelService.getChannelsPaged(
      this.currentPage,
      this.pageSize,
      'channelNumber',
      'asc',
      this.filters
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (pagedData) => {
        this.channels = pagedData.content;
        this.totalElements = pagedData.totalElements;
        this.totalPages = pagedData.totalPages;
        this.error = null;
      },
      error: (error) => {
        console.error('Error loading channels:', error);
        this.error = error.message;
        this.channels = [];
      }
    });
  }

  onSearchChange(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    this.filters = {
      search: this.searchTerm || undefined,
      categoryId: this.selectedCategoryId || undefined,
      languageId: this.selectedLanguageId || undefined
    };
    
    this.currentPage = 0; // Reset to first page
    this.loadChannels();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategoryId = null;
    this.selectedLanguageId = null;
    this.filters = {};
    this.currentPage = 0;
    this.loadChannels();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadChannels();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
    this.loadChannels();
  }

  deleteChannel(id: number): void {
    if (confirm('Are you sure you want to delete this channel?')) {
      this.tvChannelService.deleteChannel(id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.loadChannels(); // Refresh the list
        },
        error: (error) => {
          console.error('Error deleting channel:', error);
          this.error = error.message;
        }
      });
    }
  }

  addChannel(): void {
    this.router.navigate(['/channels/add']);
  }

  refreshChannels(): void {
    this.tvChannelService.refreshChannels();
    this.loadChannels();
  }

  onSortChange(sortBy: string): void {
    // Implement sorting logic
    this.loadChannels();
  }
}