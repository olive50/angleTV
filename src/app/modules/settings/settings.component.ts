import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent implements OnInit {
  activeTab = 'general';

  settingsTabs = [
    { id: 'general', label: 'General Settings', icon: 'fas fa-cog' },
    { id: 'system', label: 'System Settings', icon: 'fas fa-server' },
    { id: 'users', label: 'User Management', icon: 'fas fa-users' },
  ];

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Set active tab based on route
    this.route.firstChild?.url.subscribe((url) => {
      if (url.length > 0) {
        this.activeTab = url[0].path;
      }
    });
  }

  onTabChange(tabId: string): void {
    this.activeTab = tabId;
    this.router.navigate([tabId], { relativeTo: this.route });
  }
}
