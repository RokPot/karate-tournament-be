import { ReactNode, useContext, useEffect, useState, useRef } from 'react';

import { AdminContext, AdminRest } from '~common/admin/admin.helpers';
import { IAdminAccount } from '~common/admin/admin.types';
import { AuthnContext } from '~common/authn/authn.helpers';

export function AdminContextProvider(props: { children: ReactNode }) {
  const authnProvider = useContext(AuthnContext);
  const [adminAccount, setAdminAccount] = useState<IAdminAccount>();
  const refreshPromiseRef = useRef<Promise<IAdminAccount> | null>(null);

  const fetchAndSetAdminAccount = async (token: string): Promise<IAdminAccount> => {
    console.log('fetchAndSetAdminAccount called');
    try {
      const { data: newAdminAccount } = await AdminRest.get<IAdminAccount>('/admin/account', {
        accessToken: token,
      });
      console.log('setting newAdminAccount', newAdminAccount);
      setAdminAccount(newAdminAccount);
      console.log('after setting newAdminAccount', newAdminAccount);
      return newAdminAccount;
    } catch (error) {
      console.error('Error fetching admin account:', error);
      setAdminAccount(undefined);
      throw error;
    }
  };

  const getIdentity = async () => {
    console.log(
      'getIdentity called. Current adminAccount:',
      adminAccount,
      'Is refresh pending:',
      !!refreshPromiseRef.current,
    );

    if (refreshPromiseRef.current) {
      console.log('getIdentity awaiting pending refresh promise');
      try {
        const a = await refreshPromiseRef.current;
        console.log('getIdentity resolved from pending promise:', a);
        return { id: a.id || '...', fullName: a.name || '...' };
      } catch (error) {
        console.error('getIdentity: Pending refresh promise failed:', error);
      }
    }

    if (adminAccount) {
      console.log('getIdentity using existing adminAccount state:', adminAccount);
      return { id: adminAccount.id || '...', fullName: adminAccount.name || '...' };
    }

    const token = authnProvider.authnToken?.accessToken;
    if (token) {
      console.log('getIdentity fetching account on demand');
      try {
        const a = await fetchAndSetAdminAccount(token);
        console.log('getIdentity fetched account on demand:', a);
        return { id: a.id || '...', fullName: a.name || '...' };
      } catch (error) {
        console.error('getIdentity: On-demand fetch failed:', error);
      }
    }

    console.log('getIdentity returning empty identity');
    return { id: '...', fullName: '...' };
  };

  useEffect(() => {
    const token = authnProvider.authnToken?.accessToken;
    if (!token) {
      console.log('useEffect: No token, clearing admin account and refresh promise');
      setAdminAccount(undefined);
      refreshPromiseRef.current = null;
      return;
    }

    console.log('useEffect: Token changed, initiating admin account refresh');
    refreshPromiseRef.current = fetchAndSetAdminAccount(token);
    refreshPromiseRef.current
      .catch((e) => {
        console.error('useEffect: fetchAndSetAdminAccount promise rejected', e);
      })
      .finally(() => {
        console.log('useEffect: Refresh promise settled, clearing ref');
        refreshPromiseRef.current = null;
      });
  }, [authnProvider.authnToken?.accessToken]);

  const authProviderValue = {
    ...authnProvider,
    getIdentity,
    authnToken: authnProvider.authnToken,
    setAuthnToken: authnProvider.setAuthnToken,
  };

  return (
    <AdminContext.Provider
      value={{
        setAdminAccount,
        adminAccount,
        getIdentity,
        authProvider: authProviderValue,
      }}
    >
      {props.children}
    </AdminContext.Provider>
  );
}
