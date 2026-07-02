import { Injectable, signal } from '@angular/core';
import html2canvas from 'html2canvas';

/**
 * Service for capturing DOM elements as images and sharing them.
 * Uses html2canvas (already installed) to render elements to canvas.
 */
@Injectable({ providedIn: 'root' })
export class ShareImageService {
  readonly isCapturing = signal<boolean>(false);

  /**
   * Captures a DOM element as a PNG image and triggers download.
   * @param element - the HTML element to capture
   * @param filename - download filename (without extension)
   */
  async captureAndDownload(element: HTMLElement, filename: string): Promise<void> {
    this.isCapturing.set(true);
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.png`;
      link.click();
    } finally {
      this.isCapturing.set(false);
    }
  }

  /**
   * Captures a DOM element and opens native share dialog (mobile) or copies to clipboard.
   * Falls back to download if Web Share API is not available.
   * @param element - the HTML element to capture
   * @param title - share title
   * @param text - share text/description
   */
  async captureAndShare(element: HTMLElement, title: string, text: string): Promise<void> {
    this.isCapturing.set(true);
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // Try Web Share API (mobile)
      if (navigator.share && navigator.canShare) {
        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), 'image/png'),
        );
        const file = new File([blob], `${title.replace(/\s+/g, '-')}.png`, { type: 'image/png' });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ title, text, files: [file] });
          return;
        }
      }

      // Fallback: copy to clipboard
      if (navigator.clipboard && ClipboardItem) {
        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), 'image/png'),
        );
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        return;
      }

      // Final fallback: download
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/\s+/g, '-')}.png`;
      link.click();
    } finally {
      this.isCapturing.set(false);
    }
  }
}
