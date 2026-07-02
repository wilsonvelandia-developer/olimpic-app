/**
 * Payment models — tracks tournament enrollment fees and team payments.
 * IDs are UUIDs (string).
 */

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'other';

export interface Payment {
  id:            string;
  tournamentId:  string;
  teamId:        string;
  amount:        number;
  currency:      string;
  method:        PaymentMethod;
  status:        PaymentStatus;
  reference:     string | null;
  notes:         string | null;
  paidAt:        string | null;
  createdAt:     string;
  updatedAt:     string;
  /** Denormalized for display purposes. */
  tournamentName?: string;
  teamName?:       string;
}

export interface PaymentCreateRequest {
  tournamentId: string;
  teamId:       string;
  amount:       number;
  currency?:    string;
  method:       PaymentMethod;
  reference?:   string | null;
  notes?:       string | null;
}

export interface PaymentUpdateRequest {
  amount?:    number;
  method?:    PaymentMethod;
  status?:    PaymentStatus;
  reference?: string | null;
  notes?:     string | null;
  paidAt?:    string | null;
}
