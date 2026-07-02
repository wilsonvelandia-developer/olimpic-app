import { Injectable, signal } from '@angular/core';
import { initializeApp, getApp, getApps } from 'firebase/app';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type FirebaseStorage,
  type UploadTask,
} from 'firebase/storage';
import { firebaseConfig } from '../firebase/firebase.config';

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * Image upload service using Firebase Storage.
 * Handles file uploads with progress tracking, validation, and cleanup.
 *
 * Supported: images (jpg, png, webp, gif) up to 5MB.
 */
@Injectable({ providedIn: 'root' })
export class ImageUploadService {
  private storage: FirebaseStorage;

  readonly isUploading = signal<boolean>(false);
  readonly progress = signal<number>(0);
  readonly error = signal<string | null>(null);

  private static readonly MAX_SIZE_BYTES = 5 * 1024 * 1024;
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  constructor() {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    this.storage = getStorage(app);
  }

  /**
   * Uploads a file to Firebase Storage.
   * @param file - the File object from input or drag-and-drop
   * @param folder - storage folder path (e.g. 'teams', 'gallery', 'tournaments')
   * @returns Promise with the download URL and storage path
   */
  async upload(file: File, folder: string): Promise<UploadResult> {
    this.error.set(null);
    this.progress.set(0);

    const validation = this.validate(file);
    if (validation) {
      this.error.set(validation);
      throw new Error(validation);
    }

    this.isUploading.set(true);

    const fileName = this.generateFileName(file.name);
    const storagePath = `${folder}/${fileName}`;
    const storageRef = ref(this.storage, storagePath);

    try {
      const uploadTask: UploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
        customMetadata: { originalName: file.name },
      });

      const url = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            this.progress.set(pct);
          },
          (err) => {
            this.isUploading.set(false);
            this.error.set('Error al subir la imagen');
            reject(err);
          },
          async () => {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          },
        );
      });

      this.isUploading.set(false);
      this.progress.set(100);
      return { url, path: storagePath };
    } catch (err) {
      this.isUploading.set(false);
      throw err;
    }
  }

  /**
   * Deletes a previously uploaded file from storage.
   * @param storagePath - the path returned by upload()
   */
  async delete(storagePath: string): Promise<void> {
    const storageRef = ref(this.storage, storagePath);
    await deleteObject(storageRef);
  }

  /**
   * Validates file type and size.
   * @returns error message or null if valid
   */
  private validate(file: File): string | null {
    if (!ImageUploadService.ALLOWED_TYPES.includes(file.type)) {
      return `Tipo de archivo no permitido. Use: JPG, PNG, WebP o GIF.`;
    }
    if (file.size > ImageUploadService.MAX_SIZE_BYTES) {
      return `El archivo excede el límite de 5MB (${(file.size / 1024 / 1024).toFixed(1)}MB).`;
    }
    return null;
  }

  /**
   * Generates a unique filename to avoid collisions.
   */
  private generateFileName(originalName: string): string {
    const ext = originalName.split('.').pop()?.toLowerCase() ?? 'jpg';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}.${ext}`;
  }
}
