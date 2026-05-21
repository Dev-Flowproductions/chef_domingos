import { lkmCall } from './client';

export interface RegisterPhoneParams {
  name:             string;
  phone:            string;
  countryCode?:     string;
  email?:           string;
  password?:        string;
  acceptMarketing?: boolean;
}

export interface RegisterEmailParams {
  name:             string;
  email:            string;
  password:         string;
  phone?:           string;
  acceptMarketing?: boolean;
}

export interface LkmCardResult {
  cardCode:  string;
  shortCode: string;
}

export async function registerPhoneWithLkm(params: RegisterPhoneParams): Promise<LkmCardResult> {
  return lkmCall<LkmCardResult>('lkm-account', {
    method: 'POST',
    body: { action: 'register-phone', ...params },
  });
}

export async function registerEmailWithLkm(params: RegisterEmailParams): Promise<LkmCardResult> {
  return lkmCall<LkmCardResult>('lkm-account', {
    method: 'POST',
    body: { action: 'register-email', ...params },
  });
}

export async function linkExistingCard(params: {
  phone?: string;
  email?: string;
  countryCode?: string;
}): Promise<LkmCardResult> {
  return lkmCall<LkmCardResult>('lkm-account', {
    method: 'POST',
    body: { action: 'link', ...params },
  });
}

export interface LkmProfile {
  linked:     boolean;
  cardCode?:  string;
  shortCode?: string;
  lkmProfile?: Record<string, unknown>;
}

export async function getLkmProfile(): Promise<LkmProfile> {
  return lkmCall<LkmProfile>('lkm-account');
}
