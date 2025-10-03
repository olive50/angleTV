// src/app/shared/components/sidebar/sidebar.component.ts

import { Component, Input, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { MenuItem } from '../../../core/models/menu.model';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit {
  @Input() isCollapsed = false;

  menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'fas fa-tachometer-alt',
      route: '/dashboard',
    },
    {
      id: 'tv-channels',
      title: 'Media',
      icon: 'fas fa-tv',
      route: '/channels', // Add default route for TV Channels
      badge: { text: '74', color: 'success' },
      children: [
        {
          id: 'channels-list',
          title: 'TV Channels',
          icon: 'fas fa-list',
          route: '/channels',
        },
        {
          id: 'radio',
          title: 'Radio',
          icon: 'fas fa-broadcast-tower',  // ✅ Corrigé: fa-radio n'existe pas
          route: '/media/radio',
        },
        {
          id: 'vod',
          title: 'VOD',
          icon: 'fas fa-play-circle',  // ✅ Corrigé: fa-vod n'existe pas
          route: '/media/vod',
        },
        {
          id: 'movies',
          title: 'Movies',
          icon: 'fas fa-film',  // ✅ Corrigé: fa-movie n'existe pas
          route: '/media/movies',  // ⚠️ Corrigé: route était '/media/radio'
        },
        {
          id: 'game',
          title: 'Games',
          icon: 'fas fa-gamepad',  // ✅ Corrigé: fa-game n'existe pas
          route: '/media/games',
        },
        {
          id: 'audiobook',
          title: 'Audio Books',
          icon: 'fas fa-book-open',  // ✅ Corrigé: fa-audio n'existe pas
          route: '/media/audiobooks',  // ⚠️ Corrigé: route était '/media/radio'
        },
        {
          id: 'series',
          title: 'Series',
          icon: 'fas fa-video',  // ✅ Corrigé: fa-series n'existe pas
          route: '/media/series',  // ⚠️ Corrigé: route était '/media/game'
        },
     
      ],
    },
    {
      id: 'rooms',
      title: 'Rooms',
      icon: 'fas fa-bed',
      children: [
        {
          id: 'rooms-list',
          title: 'Room List',
          icon: 'fas fa-list',
          route: '/rooms',
        },
        {
          id: 'rooms-status',
          title: 'Room Status',
          icon: 'fas fa-chart-bar',
          route: '/rooms/status-management',
        },
      ],
    },
    {
      id: 'terminals',
      title: 'Terminals',
      icon: 'fas fa-desktop',
      route: '/terminals',
      badge: { text: '12', color: 'success' },
    },
    {
      id: 'guests',
      title: 'Guests',
      icon: 'fas fa-users',
      children: [
        {
          id: 'guests-list',
          title: 'Guest List',
          icon: 'fas fa-list',
          route: '/guests',
        },
        {
          id: 'guests-checkin',
          title: 'Check-in',
          icon: 'fas fa-sign-in-alt',
          route: '/guests/checkin',
        },
        {
          id: 'guests-checkout',
          title: 'Check-out',
          icon: 'fas fa-sign-out-alt',
          route: '/guests/checkout',
        },
        {
          id: 'guests-move',
          title: 'Move',
          icon: 'fas fa-sign-out-alt',
          route: '/guests/move',
        },
      ],
    },
    {
      id: 'hotel',
      title: 'Hotel',
      icon: 'fas fa-building',
      route: '/company',
    },
    {
      id: 'languages',
      title: 'Languages',
      icon: 'fas fa-language',
      children: [
        {
          id: 'languages-list',
          title: 'Language List',
          icon: 'fas fa-list',
          route: '/languages',
        },
        {
          id: 'translations',
          title: 'Translation',
          icon: 'fas fa-language',
          route: '/languages/translations',
        },
      ],
    },
    {
      id: 'epg',
      title: 'EPG',
      icon: 'fas fa-calendar-week',
      route: '/epgs',
    },
    {
      id: 'signage',
      title: 'Signage',
      icon: 'fas fa-tv-alt',
      route: '/signage',
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: 'fas fa-chart-bar',
      children: [
        {
          id: 'reports-occupancy',
          title: 'Occupancy',
          icon: 'fas fa-chart-pie',
          route: '/reports/occupancy',
        },
        {
          id: 'reports-revenue',
          title: 'Revenue',
          icon: 'fas fa-dollar-sign',
          route: '/reports/revenue',
        },
        {
          id: 'reports-devices',
          title: 'Device Usage',
          icon: 'fas fa-chart-line',
          route: '/reports/devices',
        },
      ],
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'fas fa-cog',
      route: '/settings',
    },
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Set active menu item based on current route
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        )
      )
      .subscribe((event: NavigationEnd) => {
        this.setActiveMenuItem(event.url);
      });

    // Set initial active state
    this.setActiveMenuItem(this.router.url);
  }

  toggleMenuItem(item: MenuItem): void {
    if (item.children) {
      // Toggle expansion
      item.isExpanded = !item.isExpanded;

      // Collapse other expanded items (optional)
      this.menuItems.forEach((menuItem) => {
        if (menuItem.id !== item.id && menuItem.children) {
          menuItem.isExpanded = false;
        }
      });

      // Navigate to default route if item has one AND is being expanded
      if (item.isExpanded && item.route) {
        this.router.navigate([item.route]);
      }
    } else if (item.route) {
      // For items without children, just navigate
      this.router.navigate([item.route]);
    }
  }

  private setActiveMenuItem(url: string): void {
    this.menuItems.forEach((item) => {
      item.isActive = false;

      if (item.children) {
        let hasActiveChild = false;
        item.children.forEach((child) => {
          // Check exact match and route starts with patterns
          const isChildActive = !!(
            child.route === url ||
            (child.route && url.startsWith(child.route) && url !== '/')
          );
          child.isActive = isChildActive;

          if (isChildActive) {
            hasActiveChild = true;
            item.isExpanded = true;
          }
        });

        // Set parent as active if any child is active
        item.isActive = hasActiveChild;

        // Collapse submenu if no child is active
        if (!hasActiveChild) {
          item.isExpanded = false;
        }
      } else {
        // For items without children, check exact match or route starts with
        item.isActive = !!(
          item.route === url ||
          (item.route && url.startsWith(item.route) && url !== '/')
        );
      }
    });
  }
}
