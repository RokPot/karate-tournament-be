import { AuthProvider } from 'ra-core';

export const AUTHN_LOCAL_STORAGE_KEY = '_authntoken';

export interface IAuthnTokenData {
  exp: number;
  uid: string;
}

export interface IAuthnToken {
  accessToken: string;
  refreshToken?: string;
  accessTokenData: IAuthnTokenData;
}

export type AuthnProvider = AuthProvider;
