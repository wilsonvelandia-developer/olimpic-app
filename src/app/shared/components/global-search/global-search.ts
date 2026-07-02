import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface SearchResult {
  id: string;
  type: 'tournament' | 'team' | 'player' | 'match';
  title: string;
  subtitle: string;
  route: string;
}

/**
 * Global search component — searches across tournaments, teams, players, and matches.
 * Triggered by clicking the search icon or pressing Ctrl+K.
 */
@Component({
  selector: 'app-global-search',
  imports: [FormsModule],
  templateUrl: './global-search.html',
  styleUrl: './global-search.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalSearch {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly isOpen = signal<boolean>(false);
  readonly query = signal<string>('');
  readonly results = signal<SearchResult[]>([]);
  readonly isSearching = signal<boolean>(false);

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  open(): void {
    this.isOpen.set(true);
    this.query.set('');
    this.results.set([]);
  }

  close(): void {
    this.isOpen.set(false);
    this.query.set('');
    this.results.set([]);
  }

  onQueryChange(value: string): void {
    this.query.set(value);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);

    if (value.trim().length < 2) {
      this.results.set([]);
      return;
    }

    this.debounceTimer = setTimeout(() => this.search(value.trim()), 300);
  }

  onSelectResult(result: SearchResult): void {
    this.close();
    this.router.navigate([result.route]);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.close();
  }

  private search(term: string): void {
    this.isSearching.set(true);
    const allResults: SearchResult[] = [];
    let completed = 0;
    const total = 3;

    const finish = () => {
      completed++;
      if (completed >= total) {
        this.results.set(allResults.slice(0, 15));
        this.isSearching.set(false);
      }
    };

    // Search tournaments
    this.api.get<Array<{ id: string; name: string; category: string | null; status: string }>>('/tournaments').subscribe({
      next: (res) => {
        const matches = (res.data ?? []).filter((t) =>
          t.name.toLowerCase().includes(term.toLowerCase()),
        );
        allResults.push(...matches.slice(0, 5).map((t) => ({
          id: t.id, type: 'tournament' as const,
          title: t.name, subtitle: `${t.category ?? ''} — ${t.status}`,
          route: `/tournaments/${t.id}`,
        })));
        finish();
      },
      error: finish,
    });

    // Search teams
    this.api.get<Array<{ id: string; name: string; shortName: string | null; status: string }>>(`/teams?search=${encodeURIComponent(term)}`).subscribe({
      next: (res) => {
        allResults.push(...(res.data ?? []).slice(0, 5).map((t) => ({
          id: t.id, type: 'team' as const,
          title: t.name, subtitle: t.shortName ?? t.status,
          route: `/teams/${t.id}`,
        })));
        finish();
      },
      error: finish,
    });

    // Search players (via teams service)
    this.api.get<Array<{ id: string; name: string; teamId: string; jerseyNumber: number }>>(`/teams/players?search=${encodeURIComponent(term)}`).subscribe({
      next: (res) => {
        allResults.push(...(res.data ?? []).slice(0, 5).map((p) => ({
          id: p.id, type: 'player' as const,
          title: p.name, subtitle: `#${p.jerseyNumber}`,
          route: `/players/${p.id}`,
        })));
        finish();
      },
      error: finish,
    });
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'tournament': return '🏆';
      case 'team': return '👥';
      case 'player': return '🏃';
      case 'match': return '⚽';
      default: return '🔍';
    }
  }
}
