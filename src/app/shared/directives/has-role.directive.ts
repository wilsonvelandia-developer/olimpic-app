import {
  Directive,
  inject,
  input,
  TemplateRef,
  ViewContainerRef,
  effect,
} from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import type { AppRole } from '../../core/models/role.model';

/**
 * Structural directive that conditionally renders content based on the user's role.
 *
 * Usage:
 * ```html
 * <!-- Show only to admins -->
 * <button *hasRole="'admin'">Eliminar</button>
 *
 * <!-- Show to editors and admins (minimum role) -->
 * <button *hasRole="'editor'">Editar</button>
 * ```
 *
 * Uses the role hierarchy: admin ≥ editor ≥ viewer
 * The element is removed from the DOM entirely when access is denied (not just hidden).
 */
@Directive({
  selector: '[hasRole]',
})
export class HasRoleDirective {
  private readonly auth = inject(AuthService);
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);

  /** Minimum role required to see the element. */
  readonly hasRole = input.required<AppRole>();

  private hasView = false;

  constructor() {
    effect(() => {
      const allowed = this.auth.hasRole(this.hasRole());
      if (allowed && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!allowed && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }
}
