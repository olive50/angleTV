import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

export interface Language {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  channelCount: number;
  flag: string;
}

@Component({
  selector: 'app-languages-list',
  templateUrl: './languages-list.component.html',
  styleUrls: ['./languages-list.component.css'],
})
export class LanguagesListComponent implements OnInit {
  languages: Language[] = [
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
    {
      id: 4,
      name: 'Spanish',
      code: 'ES',
      isActive: false,
      channelCount: 15,
      flag: '🇪🇸',
    },
    {
      id: 5,
      name: 'German',
      code: 'DE',
      isActive: true,
      channelCount: 12,
      flag: '🇩🇪',
    },
  ];

  filteredLanguages = [...this.languages];
  searchTerm = '';
  activeFilter = '';

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

  toggleLanguageStatus(id: number): void {
    const language = this.languages.find((l) => l.id === id);
    if (language) {
      language.isActive = !language.isActive;
      this.applyFilters();
    }
  }

  deleteLanguage(id: number): void {
    if (confirm('Are you sure you want to delete this language?')) {
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
