export type DriftStatus = 'ok' | 'warning' | 'alert';

export interface DriftResponse {
  status: DriftStatus;
  psi: number;
  adwin_triggered: boolean;
  last_checked: string;
  last_retrain: string;
}
