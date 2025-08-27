import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor() {
    // Initialize with some sample notifications
    const sampleNotifications: Notification[] = [
      {
        id: '1',
        type: 'warning',
        title: 'Terminal Offline',
        message: 'Terminal STB001 in Room 101 is offline',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
      },
      {
        id: '2',
        type: 'success',
        title: 'Guest Checked In',
        message: 'Ahmed Ben Ali successfully checked into Room 205',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        read: false,
      },
      {
        id: '3',
        type: 'info',
        title: 'System Update',
        message: 'IPTV system updated to version 2.1.0',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: true,
      },
    ];

    this.notificationsSubject.next(sampleNotifications);
  }

  addNotification(
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ): void {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date(),
      read: false,
    };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([newNotification, ...currentNotifications]);
  }

  markAsRead(notificationId: string): void {
    const notifications = this.notificationsSubject.value.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    this.notificationsSubject.next(notifications);
  }

  markAllAsRead(): void {
    const notifications = this.notificationsSubject.value.map((n) => ({
      ...n,
      read: true,
    }));
    this.notificationsSubject.next(notifications);
  }

  removeNotification(notificationId: string): void {
    const notifications = this.notificationsSubject.value.filter(
      (n) => n.id !== notificationId
    );
    this.notificationsSubject.next(notifications);
  }

  getUnreadCount(): number {
    return this.notificationsSubject.value.filter((n) => !n.read).length;
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}
