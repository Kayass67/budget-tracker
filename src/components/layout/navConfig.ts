import {
  LayoutDashboard,
  User,
  Calculator,
  GitCompare,
  Settings,
  LucideIcon,
} from 'lucide-react';

export interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

export const navigationItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Profile', path: '/profile', icon: User },
  { name: 'Analyzer', path: '/analyzer', icon: Calculator },
  { name: 'Compare', path: '/compare', icon: GitCompare },
  { name: 'Settings', path: '/settings', icon: Settings },
];

