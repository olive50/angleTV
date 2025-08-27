import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stats-card',
  templateUrl: './stats-card.component.html',
  styleUrls: ['./stats-card.component.css'],
})
export class StatsCardComponent {
  @Input() title: string = '';
  @Input() value: string | number = '';
  @Input() icon: string = '';
  @Input() color: 'primary' | 'success' | 'warning' | 'info' | 'danger' =
    'primary';
  @Input() trend: string = '';
  @Input() trendUp: boolean = true;
}
