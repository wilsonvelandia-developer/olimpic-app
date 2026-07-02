import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AnnouncementService } from '../announcement.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { AuthService } from '../../../core/services/auth.service';
import type { Announcement } from '../../../core/models';

@Component({
  selector: 'app-announcement-detail',
  imports: [RouterLink, DatePipe, LoadingSpinner, ConfirmDialog],
  templateUrl: './announcement-detail.html',
  styleUrl: './announcement-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly announcementService = inject(AnnouncementService);
  readonly auth = inject(AuthService);

  readonly announcement = signal<Announcement | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showDeleteDialog = signal<boolean>(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadAnnouncement(id);
  }

  private loadAnnouncement(id: string): void {
    this.isLoading.set(true);
    this.announcementService.getById(id).subscribe({
      next: (d) => { this.announcement.set(d); this.isLoading.set(false); },
      error: () => { this.errorMessage.set('No se pudo cargar el comunicado.'); this.isLoading.set(false); },
    });
  }

  onEdit(): void {
    const id = this.announcement()?.id;
    if (id) this.router.navigate(['/announcements', id, 'edit']);
  }

  onDeleteConfirm(): void { this.showDeleteDialog.set(true); }
  onDeleteCancelled(): void { this.showDeleteDialog.set(false); }

  onDeleteConfirmed(): void {
    const id = this.announcement()?.id;
    if (!id) return;
    this.showDeleteDialog.set(false);
    this.announcementService.delete(id).subscribe({
      next: () => this.router.navigate(['/announcements']),
      error: () => this.errorMessage.set('No se pudo eliminar el comunicado.'),
    });
  }
}
