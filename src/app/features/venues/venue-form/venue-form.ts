import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { VenueService } from '../venue.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ImageUpload } from '../../../shared/components/image-upload/image-upload';
import { MapPicker } from '../../../shared/components/map-picker/map-picker';

@Component({
  selector: 'app-venue-form',
  imports: [ReactiveFormsModule, LoadingSpinner, ImageUpload, MapPicker],
  templateUrl: './venue-form.html',
  styleUrl: './venue-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VenueForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly venueService = inject(VenueService);

  readonly isEditMode = signal<boolean>(false);
  readonly venueId = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly statusOptions = [
    { value: 'active', label: 'Activa' },
    { value: 'inactive', label: 'Inactiva' },
    { value: 'maintenance', label: 'En mantenimiento' },
  ];

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    address: ['', [Validators.required, Validators.maxLength(300)]],
    city: ['', [Validators.required, Validators.maxLength(100)]],
    capacity: [null as number | null],
    imageUrl: [''],
    phone: [''],
    email: [''],
    mapUrl: [''],
    description: [''],
    status: ['active'],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.venueId.set(id);
      this.loadVenue(id);
    }
  }

  private loadVenue(id: string): void {
    this.isLoading.set(true);
    this.venueService.getById(id).subscribe({
      next: (v) => {
        this.form.patchValue({
          name: v.name,
          address: v.address,
          city: v.city,
          capacity: v.capacity,
          imageUrl: v.imageUrl ?? '',
          phone: v.phone ?? '',
          email: v.email ?? '',
          mapUrl: v.mapUrl ?? '',
          description: v.description ?? '',
          status: v.status ?? 'active',
        });
        this.isLoading.set(false);
      },
      error: () => { this.errorMessage.set('No se pudo cargar la sede.'); this.isLoading.set(false); },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving.set(true);
    this.errorMessage.set(null);

    const v = this.form.value;
    const id = this.venueId();

    if (id) {
      this.venueService.update(id, {
        name: v.name!,
        address: v.address!,
        city: v.city!,
        capacity: v.capacity || null,
        imageUrl: v.imageUrl || null,
        phone: v.phone || null,
        email: v.email || null,
        mapUrl: v.mapUrl || null,
        description: v.description || null,
        status: (v.status as 'active' | 'inactive' | 'maintenance') || 'active',
      }).subscribe({
        next: () => { this.isSaving.set(false); this.router.navigate(['/venues']); },
        error: () => { this.errorMessage.set('No se pudo guardar la sede.'); this.isSaving.set(false); },
      });
    } else {
      this.venueService.create({
        name: v.name!,
        address: v.address!,
        city: v.city!,
        capacity: v.capacity || null,
        imageUrl: v.imageUrl || null,
        phone: v.phone || null,
        email: v.email || null,
        mapUrl: v.mapUrl || null,
        description: v.description || null,
      }).subscribe({
        next: () => { this.isSaving.set(false); this.router.navigate(['/venues']); },
        error: () => { this.errorMessage.set('No se pudo guardar la sede.'); this.isSaving.set(false); },
      });
    }
  }

  onImageUploaded(url: string): void {
    this.form.patchValue({ imageUrl: url });
  }

  onMapUrlChanged(url: string): void {
    this.form.patchValue({ mapUrl: url });
  }

  onCancel(): void { this.router.navigate(['/venues']); }

  isFieldInvalid(f: string): boolean { const c = this.form.get(f); return !!(c?.invalid && c?.touched); }
  getFieldError(f: string): string {
    const c = this.form.get(f);
    if (!c?.errors || !c.touched) return '';
    if (c.errors['required']) return 'Este campo es requerido.';
    if (c.errors['minlength']) return `Mínimo ${c.errors['minlength'].requiredLength} caracteres.`;
    if (c.errors['maxlength']) return `Máximo ${c.errors['maxlength'].requiredLength} caracteres.`;
    return 'Valor inválido.';
  }
}
