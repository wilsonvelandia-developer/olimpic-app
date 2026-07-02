import { Component, ChangeDetectionStrategy, inject, input, ElementRef, ViewChild } from '@angular/core';
import { ShareImageService } from '../../../core/services/share-image.service';

/**
 * Share button — captures a target element as an image and shares/downloads it.
 * Usage: <app-share-button [targetRef]="myElement" title="Posiciones Copa 2026" />
 */
@Component({
  selector: 'app-share-button',
  template: `
    <button type="button" class="btn btn--secondary btn--sm"
      [disabled]="shareService.isCapturing()"
      (click)="onShare()">
      {{ shareService.isCapturing() ? 'Capturando...' : '📤 Compartir' }}
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareButton {
  readonly shareService = inject(ShareImageService);

  /** Reference to the HTML element to capture. */
  readonly targetRef = input.required<HTMLElement>();
  /** Title for the shared image. */
  readonly title = input<string>('OlimpicApp');

  onShare(): void {
    const el = this.targetRef();
    if (el) {
      this.shareService.captureAndShare(el, this.title(), 'Compartido desde OlimpicApp');
    }
  }
}
