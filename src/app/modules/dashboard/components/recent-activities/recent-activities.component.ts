import { Component, Input } from '@angular/core';

export interface Activity {
  id: number;
  action: string;
  details: string;
  timestamp: Date;
  icon: string;
  type: string;
}

@Component({
  selector: 'app-recent-activities',
  templateUrl: './recent-activities.component.html',
  styleUrls: ['./recent-activities.component.css'],
})
export class RecentActivitiesComponent {
  @Input() activities: Activity[] = [];
}
