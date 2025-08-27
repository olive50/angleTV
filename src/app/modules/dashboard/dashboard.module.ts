import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { DashboardComponent } from './components/dashboard.component';
import { StatsCardComponent } from './components/stats-card/stats-card.component';
import { QuickActionsComponent } from './components/quick-actions/quick-actions.component';
import { RecentActivitiesComponent } from './components/recent-activities/recent-activities.component';

const routes: Routes = [{ path: '', component: DashboardComponent }];

@NgModule({
  declarations: [
    DashboardComponent,
    StatsCardComponent,
    QuickActionsComponent,
    RecentActivitiesComponent,
  ],
  imports: [CommonModule, RouterModule.forChild(routes)],
})
export class DashboardModule {}
