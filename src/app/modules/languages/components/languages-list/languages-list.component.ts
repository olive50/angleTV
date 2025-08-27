import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-languages-list',
  templateUrl: './languages-list.component.html',
  styleUrls: ['./languages-list.component.css'],
})
export class LanguagesListComponent implements OnInit {
  languages: any[] = [
    {
      id: 1,
      name: 'Arabic',
      code: 'AR',
      isActive: true,
      channelCount: 45,
      flag: '🇩🇿',
    },
    {
      id: 2,
      name: 'English',
      code: 'EN',
      isActive: true,
      channelCount: 32,
      flag: '🇺🇸',
    },
    {
      id: 3,
      name: 'French',
      code: 'FR',
      isActive: true,
      channelCount: 28,
      flag: '🇫🇷',
    },
  ];

  filteredLanguages = [...this.languages];
  searchTerm = '';
  activeFilter = '';

  loyaltyLevels = [
    { value: 'BRONZE', label: 'Bronze', class: 'bronze' },
    { value: 'SILVER', label: 'Silver', class: 'silver' },
    { value: 'GOLD', label: 'Gold', class: 'gold' },
    { value: 'PLATINUM', label: 'Platinum', class: 'platinum' },
    { value: 'DIAMOND', label: 'Diamond', class: 'diamond' },
  ];

  statuses = [
    { value: 'CONFIRMED', label: 'Confirmed', class: 'warning' },
    { value: 'CHECKED_IN', label: 'Checked In', class: 'success' },
    { value: 'CHECKED_OUT', label: 'Checked Out', class: 'secondary' },
  ];

  constructor(private router: Router) {}

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
    this.filteredLanguages = this.languages.filter((language) => {
      const matchesSearch =
        !this.searchTerm ||
        language.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        language.code.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesActive =
        !this.activeFilter ||
        (this.activeFilter === 'true' && language.isActive) ||
        (this.activeFilter === 'false' && !language.isActive);

      return matchesSearch && matchesActive;
    });
  }

  editLanguage(id: number): void {
    this.router.navigate(['/languages', id, 'edit']);
  }

  deleteLanguage(id: number): void {
    if (confirm('Are you sure?')) {
      this.languages = this.languages.filter((l) => l.id !== id);
      this.applyFilters();
    }
  }

  addLanguage(): void {
    this.router.navigate(['/languages/add']);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.activeFilter = '';
    this.applyFilters();
  }
}
