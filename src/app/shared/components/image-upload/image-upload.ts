import {
  Component, ChangeDetectionStrategy, inject, signal, output, input,
} from '@angular/core';
import { ImageUploadService } from '../../../core/services/image-upload.service';

/**
 * Reusable image upload component with drag-and-drop support.
 * Emits the Firebase Storage URL on successful upload.
 */
@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.html',
  styleUrl: './image-upload.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageUpload {
  private readonly uploadService = inject(ImageUploadService);

  /** Storage folder path (e.g. 'teams', 'gallery'). */
  readonly folder = input<string>('uploads');
  /** Label shown above the drop zone. */
  readonly label = input<string>('Imagen');
  /** Current image URL (for preview). */
  readonly currentUrl = input<string | null>(null);

  /** Emits the download URL after successful upload. */
  readonly uploaded = output<string>();

  readonly preview = signal<string | null>(null);
  readonly isDragging = signal<boolean>(false);

  get isUploading() { return this.uploadService.isUploading; }
  get progress() { return this.uploadService.progress; }
  get error() { return this.uploadService.error; }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.handleFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.handleFile(file);
  }

  private async handleFile(file: File): Promise<void> {
    // Show local preview immediately
    this.preview.set(URL.createObjectURL(file));

    try {
      const result = await this.uploadService.upload(file, this.folder());
      this.uploaded.emit(result.url);
    } catch {
      this.preview.set(null);
    }
  }
}
