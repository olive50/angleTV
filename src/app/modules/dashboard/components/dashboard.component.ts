import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  stats = [
    {
      title: 'Total Rooms',
      value: 150,
      icon: 'fas fa-bed',
      color: 'primary',
      trend: '+5%',
      trendUp: true,
    },
    {
      title: 'Occupied Rooms',
      value: 120,
      icon: 'fas fa-users',
      color: 'success',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Active Terminals',
      value: 145,
      icon: 'fas fa-desktop',
      color: 'info',
      trend: '-2%',
      trendUp: false,
    },
    {
      title: 'Today Revenue',
      value: '$12,450',
      icon: 'fas fa-dollar-sign',
      color: 'warning',
      trend: '+8%',
      trendUp: true,
    },
  ];

  quickActions = [
    {
      title: 'Check-in Guest',
      icon: 'fas fa-sign-in-alt',
      route: '/guests/checkin',
      color: 'success',
    },
    {
      title: 'Add Terminal',
      icon: 'fas fa-plus',
      route: '/terminals/add',
      color: 'primary',
    },
    {
      title: 'New Channel',
      icon: 'fas fa-tv',
      route: '/channels/add',
      color: 'info',
    },
    {
      title: 'View Reports',
      icon: 'fas fa-chart-bar',
      route: '/reports',
      color: 'warning',
    },
  ];

  recentActivities = [
    {
      id: 1,
      action: 'Guest checked in',
      details: 'Ahmed Ben Ali - Room 205',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      icon: 'fas fa-sign-in-alt',
      type: 'checkin',
    },
    {
      id: 2,
      action: 'Terminal status updated',
      details: 'STB001 - Status changed to Active',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      icon: 'fas fa-desktop',
      type: 'terminal',
    },
    {
      id: 3,
      action: 'New channel added',
      details: 'Al Jazeera News - Channel 105',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      icon: 'fas fa-tv',
      type: 'channel',
    },
    {
      id: 4,
      action: 'Guest checked out',
      details: 'Fatima Zohra - Room 101',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      icon: 'fas fa-sign-out-alt',
      type: 'checkout',
    },
  ];

  constructor() {}

  ngOnInit(): void {}
}
