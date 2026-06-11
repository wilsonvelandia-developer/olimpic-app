import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { Sidebar } from '../sidebar/sidebar';

/**
 * Main application shell. Wraps all authenticated routes.
 * Contains the navbar, sidebar, and main content area.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Navbar, Sidebar],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  readonly isSidebarOpen = signal(true);

  toggleSidebar(): void {
    this.isSidebarOpen.update((open) => !open);
  }
}
