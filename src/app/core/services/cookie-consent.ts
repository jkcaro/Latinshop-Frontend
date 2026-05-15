// ============================================================
// SERVICIO: CookieConsentService
// Gestiona el consentimiento de cookies RGPD. Persiste las
// preferencias (necesarias, analíticas, marketing) en localStorage
// y expone un signal para controlar la visibilidad del banner.
// ============================================================

import { Injectable, signal } from '@angular/core';

export interface CookieConsent {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  fecha: string;
}

const STORAGE_KEY = 'latinshop_cookie_consent';

@Injectable({ providedIn: 'root' })
export class CookieConsentService {
  private readonly _consent = signal<CookieConsent | null>(this.cargarConsentimiento());
  private readonly _bannerVisible = signal<boolean>(this._consent() === null);

  readonly consent = this._consent.asReadonly();
  readonly bannerVisible = this._bannerVisible.asReadonly();

  private cargarConsentimiento(): CookieConsent | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CookieConsent;
    } catch {
      return null;
    }
  }

  aceptarTodo(): void {
    this.guardar({ necessary: true, analytics: true, marketing: true });
  }

  rechazarOpcionales(): void {
    this.guardar({ necessary: true, analytics: false, marketing: false });
  }

  guardarPersonalizado(analytics: boolean, marketing: boolean): void {
    this.guardar({ necessary: true, analytics, marketing });
  }

  abrirPanel(): void {
    this._bannerVisible.set(true);
  }

  private guardar(prefs: Omit<CookieConsent, 'fecha'>): void {
    const consentimiento: CookieConsent = { ...prefs, fecha: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consentimiento));
    this._consent.set(consentimiento);
    this._bannerVisible.set(false);
  }
}
