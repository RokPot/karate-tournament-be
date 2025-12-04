import { createContext } from 'react';

import { config } from '~common/config';
import { RestClient } from '~common/http';

import { AUTHN_LOCAL_STORAGE_KEY, AuthnProvider, IAuthnToken } from './authn.types';

export const AuthnContext = createContext<AuthnProvider>({} as AuthnProvider);

export function setAuthnTokenToLocalStorage(token: Omit<IAuthnToken, 'accessTokenData'>) {
  localStorage.setItem(AUTHN_LOCAL_STORAGE_KEY, JSON.stringify(token));
}

export function clearAuthnTokenFromStorage() {
  localStorage.removeItem(AUTHN_LOCAL_STORAGE_KEY);
}

export function getAuthnTokenFromLocalStorage(): IAuthnToken | null {
  try {
    const tokenJson = localStorage.getItem(AUTHN_LOCAL_STORAGE_KEY);
    if (!tokenJson) return null;
    const token = JSON.parse(tokenJson);
    return token as IAuthnToken;
  } catch (e: any) {
    console.error('getAuthnTokenFromLocalStorage', e);
    return null;
  }
}

export function applyAccessTokenData(authnToken: Omit<IAuthnToken, 'accessTokenData'>): IAuthnToken {
  return {
    accessToken: authnToken.accessToken,
    refreshToken: authnToken.refreshToken,
    accessTokenData: JSON.parse(window.atob(authnToken.accessToken.split('.')[1].replace('-', '+').replace('_', '/'))),
  };
}

export const AuthnRest = new RestClient(config.apiBaseUrl);

export async function authnRegisterCall(data: { email: string; password: string }) {
  const { data: authToken } = await AuthnRest.post<IAuthnToken>('/admin/auth/register', {
    body: data,
  });
  return applyAccessTokenData(authToken);
}

export async function authnLoginCall(data: { email: string; password: string }) {
  const { data: authToken } = await AuthnRest.post<IAuthnToken>('/admin/auth/login', {
    body: data,
    accessToken: null,
  });
  return applyAccessTokenData(authToken);
}

export function shouldRefreshAuthnToken(authnToken: IAuthnToken) {
  if (!authnToken?.accessTokenData?.exp) throw new Error('Invalid access token');
  return authnToken.accessTokenData.exp - Date.now() / 1000 < 60;
}

export async function authnRefreshTokenCall(refreshToken: string): Promise<IAuthnToken> {
  const { data: authToken } = await AuthnRest.post<IAuthnToken>('/admin/auth/refresh', {
    body: { refreshToken: refreshToken },
    accessToken: null,
  });
  return applyAccessTokenData(authToken);
}
