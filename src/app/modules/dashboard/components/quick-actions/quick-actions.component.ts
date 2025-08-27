import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

export interface QuickAction {
  title: string;
  icon: string;
  route: string;
  color: 'primary' | 'success' | 'warning' | 'info' | 'danger';
}

@Component({
  selector: 'app-quick-actions',
  templateUrl: './quick-actions.component.html',
  styleUrls: ['./quick-actions.component.css'],
})
export class QuickActionsComponent {
  @Input() actions: QuickAction[] = [];

  constructor(private router: Router) {}

  onActionClick(action: QuickAction): void {
    this.router.navigate([action.route]);
  }
}
