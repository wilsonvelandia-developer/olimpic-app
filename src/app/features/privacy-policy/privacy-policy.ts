import { Component, ChangeDetectionStrategy } from '@angular/core';

/**
 * Privacy Policy page — publicly accessible at /politica-de-privacidad.
 * Contains the data treatment policy in compliance with Colombian law (Ley 1581 de 2012).
 */
@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPolicy {}
