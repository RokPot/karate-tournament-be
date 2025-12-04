import { useNotify } from 'ra-core';
import { ReactNode, useState } from 'react';

import { RestError } from '~common/http';

import {
  AuthnContext,
  getAuthnTokenFromLocalStorage,
  setAuthnTokenToLocalStorage,
  clearAuthnTokenFromStorage,
  authnRefreshTokenCall,
  shouldRefreshAuthnToken,
  authnRegisterCall,
  authnLoginCall,
} from '../authn.helpers';
import { IAuthnToken } from '../authn.types';

export function AuthnContextProvider(props: { children: ReactNode }) {
  const [authnToken, _setAuthnToken] = useState<IAuthnToken | null>(getAuthnTokenFromLocalStorage());
  const notify = useNotify();

  const clearToken = () => {
    clearAuthnTokenFromStorage();
    _setAuthnToken(null);
  };

  const setAuthnToken = (_newAuthnToken: IAuthnToken) => {
    _setAuthnToken(_newAuthnToken);
    setAuthnTokenToLocalStorage(_newAuthnToken);
    return _newAuthnToken;
  };

  const authnRefreshToken = async (oldToken?: IAuthnToken) => {
    const rt = oldToken?.refreshToken || authnToken?.refreshToken;
    if (!rt) return Promise.reject('No refresh token');
    try {
      const at = await authnRefreshTokenCall(rt);
      setAuthnToken(at);
      return at;
    } catch (e) {
      if (e instanceof RestError && e.code !== 'network-error') {
        // server disagreed with our token, clear it
        clearToken();
      }
      throw e;
    }
  };

  const getAuthnToken = async () => {
    if (!authnToken) return Promise.reject('No access token');
    return shouldRefreshAuthnToken(authnToken) ? await authnRefreshToken(authnToken) : authnToken;
  };

  const authnRegister = async (data: { email: string; password: string }) => {
    return authnRegisterCall(data);
  };

  const authnLogin = async (data: { email: string; password: string }) => {
    return authnLoginCall(data);
  };

  // react admin auth provider methods

  const getIdentity = async () => {
    const at = await getAuthnToken();
    return Promise.resolve({
      id: at.accessTokenData.uid,
      fullName: at.accessTokenData.exp.toString(),
    });
  };

  const logout = () => {
    clearToken();
    return Promise.resolve();
  };

  const login = async (data: { email: string; password: string }) => {
    setAuthnToken(await authnLoginCall(data));
    return Promise.resolve();
  };

  const checkAuth = async () => {
    await getAuthnToken();
  };

  const checkError = async (e: any) => {
    if (e instanceof RestError && e.code === 'network-error') {
      notify('Your session has expired, please log in again', { type: 'error' });
      throw e;
    }

    if (e.status === 401 || e.status === 403) {
      // try to refresh the token
      if (authnToken && shouldRefreshAuthnToken(authnToken)) {
        await authnRefreshToken(authnToken);
        return;
      }

      notify('Your session has expired, please log in again', { type: 'error' });
      throw e;
    }
  };

  const getPermissions = async () => {
    return Promise.resolve();
  };

  return (
    <AuthnContext.Provider
      value={{
        authnRegister,
        authnLogin,
        authnToken,
        getAuthnToken,
        setAuthnToken,
        //
        getIdentity,
        logout,
        login,
        checkError,
        checkAuth,
        getPermissions,
      }}
    >
      {props.children}
    </AuthnContext.Provider>
  );
}
