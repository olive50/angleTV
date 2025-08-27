export interface MenuItem {
  id: string;
  title: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  permissions?: string[];
  badge?: MenuBadge;
  isActive?: boolean;
  isExpanded?: boolean;
}

export interface MenuBadge {
  text: string;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
}
