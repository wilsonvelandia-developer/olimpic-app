import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, SlicePipe } from '@angular/common';
import { AnnouncementService } from '../announcement.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { AuthService } from '../../../core/services/auth.service';
import type { Announcement } from '../../../core/models';
import type { AnnouncementFilters } from '../announcement.service';

@Component({
  selector: 'app-announcement-list',
  imports: [FormsModule, DatePipe, SlicePipe, LoadingSpinner, ConfirmDialog],
  templateUrl: './announcement-list.html',
  styleUrl: './announcement-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementList implements OnInit {
  private readonly announcementService = inject(AnnouncementService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly announcements = signal<Announcement[]>([]);
  readonly totalCount = signal<number>(0);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly showDeleteDialog = signal<boolean>(false);
  readonly selectedId = signal<string | null>(null);
  readonly selectedTitle = signal<string>('');

  readonly currentPage = signal<number>(1);
  readonly pageSize = 10;

  searchModel = '';
  priorityModel = '';
  statusModel = '';

  ngOnInit(): void {
    this.loadAnnouncements();
  }

  loadAnnouncements(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const filters: AnnouncementFilters = { page: this.currentPage(), pageSize: this.pageSize };
    if (this.searchModel.trim()) filters.search = this.searchModel.trim();
    if (this.priorityModel.trim()) filters.priority = this.priorityModel.trim();
    if (this.statusModel.trim()) filters.status = this.statusModel.trim();

    this.announcementService.getAll(filters).subscribe({
      next: (r) => { this.announcements.set(r.data); this.totalCount.set(r.total); this.isLoading.set(false); },
      error: () => { this.errorMessage.set('No se pudieron cargar los comunicados.'); this.isLoading.set(false); },
    });
  }

  onApplyFilters(): void { this.currentPage.set(1); this.loadAnnouncements(); }
  onClearFilters(): void { this.searchModel = ''; this.priorityModel = ''; this.statusModel = ''; this.currentPage.set(1); this.loadAnnouncements(); }
  onCreateAnnouncement(): void { this.router.navigate(['/announcements', 'new']); }
  onEditAnnouncement(id: string): void { this.router.navigate(['/announcements', id, 'edit']); }
  onViewDetail(id: string): void { this.router.navigate(['/announcements', id]); }

  onDeleteConfirm(a: Announcement): void {
    this.selectedId.set(a.id);
    this.selectedTitle.set(a.title);
    this.showDeleteDialog.set(true);
  }

  onDeleteCancelled(): void { this.showDeleteDialog.set(false); this.selectedId.set(null); }

  onDeleteConfirmed(): void {
    const id = this.selectedId();
    if (!id) return;
    this.showDeleteDialog.set(false);
    this.announcementService.delete(id).subscribe({
      next: () => this.loadAnnouncements(),
      error: () => this.errorMessage.set('No se pudo eliminar el comunicado.'),
    });
  }

  onPageChange(page: number): void { this.currentPage.set(page); this.loadAnnouncements(); }

  get totalPages(): number { return Math.ceil(this.totalCount() / this.pageSize); }
  get pageRange(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
}
