import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * 403 Forbidden page.
 * Shown when an authenticated user navigates to a route that requires a higher role.
 */
@Component({
  selector: 'app-forbidden',
  templateUrl: './forbidden.html',
  styleUrl: './forbidden.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Forbidden {
  private readonly router = inject(Router);

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goBack(): void {
    history.back();
  }
}
