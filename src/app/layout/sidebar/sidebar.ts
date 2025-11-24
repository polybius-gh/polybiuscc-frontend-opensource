import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { RouterLink } from '@angular/router';
import { UserSessionService } from '../../services/userSession/user_session.service';

interface MenuItem {
  label: string;
  route?: string; // optional if parent only
  roles?: string[]; // undefined = all authenticated
  children?: MenuItem[];
  expanded?: boolean; // track collapsible state
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatSidenavModule, MatListModule, RouterLink],
  templateUrl: './sidebar.html',
})
export class Sidebar {
  userRoles: string[] = [];
  sidebarOpen: boolean = false;

  menuItems: MenuItem[] = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Customers', route: '/customers' },
    {
      label: 'Administration',
      roles: ['admin'],
      children: [
        { label: 'Manage Users', route: '/admin/users', roles: ['admin'] },
        { label: 'System Variables', route: '/admin/system-variables', roles: ['admin'] },
      ],
      expanded: false,
    },
    // {
    //   label: 'Support',
    //   roles: ['Admin', 'Support'],
    //   children: [
    //     { label: 'Tickets', route: '/support/tickets', roles: ['Admin', 'Support'] },
    //   ],
    //   expanded: false,
    // },
  ];

  constructor(private userSessionService: UserSessionService) {
    this.userSessionService.userSession$.subscribe((session) => {
      this.userRoles = session ? [session.security_level] : [];
    });
  }

  get isMobile(): boolean {
    return window.innerWidth <= 599;
  }

  togleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

  isVisible(item: MenuItem): boolean {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.some((role) => this.userRoles.includes(role));
  }

  toggleExpand(item: MenuItem) {
    item.expanded = !item.expanded;
    if (this.isMobile && item.expanded) {
      this.closeSidebar();
    }
  }
}
