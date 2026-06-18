import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { LoadingSpinner }  from '../../../shared/components/loading-spinner/loading-spinner';
import { ViewToggle, type ViewMode } from '../../../shared/components/view-toggle/view-toggle';
import { AuthService }     from '../../../core/services/auth.service';
import { UserService, type AppUser } from '../user.service';

@Component({
  selector: 'app-user-list',
  imports: [LoadingSpinner, ViewToggle],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserList implements OnInit {
  private readonly userService = inject(UserService);
  private readonly router      = inject(Router);
  readonly auth = inject(AuthService);

  readonly users        = signal<AppUser[]>([]);
  readonly isLoading    = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly viewMode     = signal<ViewMode>('card');

  ngOnInit(): void { this.loadUsers(); }

  loadUsers(): void {
    this.isLoading.set(true);
    this.userService.getAll().subscribe({
      next: (data) => { this.users.set(data); this.isLoading.set(false); },
      error: () => { this.errorMessage.set('No se pudieron cargar los usuarios.'); this.isLoading.set(false); },
    });
  }

  onCreateUser(): void { this.router.navigate(['/users', 'new']); }

  onEditUser(id: string): void { this.router.navigate(['/users', id, 'edit']); }

  onDeleteUser(user: AppUser): void {
    if (!confirm(`¿Desactivar al usuario "${user.name}"? Esta acción se puede revertir.`)) return;
    this.userService.delete(user.id).subscribe({
      next: () => this.loadUsers(),
      error: () => this.errorMessage.set('No se pudo desactivar el usuario.'),
    });
  }

  roleLabel(roleId: string): string {
    const labels: Record<string, string> = {
      admin: 'Administrador', organizer: 'Organizador', coach: 'Entrenador',
      assistant: 'Asistente', delegate: 'Delegado', fitness_coach: 'Prep. Físico',
      coordinator: 'Coordinador', president: 'Presidente', player: 'Jugador',
      parent: 'Padre de familia', companion: 'Acompañante', referee: 'Árbitro',
      observer: 'Veedor',
    };
    return labels[roleId] ?? roleId;
  }
}
