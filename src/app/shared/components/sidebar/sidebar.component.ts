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
      title: 'TV Channels',
      icon: 'fas fa-tv',
      route: '/channels',
    },
    {
      id: 'rooms',
      title: 'Rooms',
      icon: 'fas fa-bed',
      route: '/rooms',
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
      ],
    },
   
    {
      id: 'reservations',
      title: 'Reservations',
      icon: 'fas fa-calendar-alt',
      route: '/reservations',
      badge: { text: '5', color: 'warning' },
    },
    {
      id: 'packages',
      title: 'Channel Packages',
      icon: 'fas fa-box',
      route: '/packages',
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
      id: 'Electronic Program guide',
      title: 'EPG',
      icon: 'fas fa-language',
      route: '/epgs',
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
      item.isExpanded = !item.isExpanded;
      // Collapse other expanded items
      this.menuItems.forEach((menuItem) => {
        if (menuItem.id !== item.id && menuItem.children) {
          menuItem.isExpanded = false;
        }
      });
    } else if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  private setActiveMenuItem(url: string): void {
    this.menuItems.forEach((item) => {
      item.isActive = false;
      if (item.children) {
        item.children.forEach((child) => {
          child.isActive = child.route === url;
          if (child.isActive) {
            item.isExpanded = true;
          }
        });
      } else {
        item.isActive = item.route === url;
      }
    });
  }
}
