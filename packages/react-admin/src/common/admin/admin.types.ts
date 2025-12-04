import { AuthProvider, DataProvider, ResourceProps, UserIdentity } from 'ra-core';
import { I18nProvider } from 'react-admin';

import { TranslationPartial } from '~common/i18n';
import { ViewComponent } from '~common/ui/view-component';

import { ResourcePropDict } from './admin.helpers';

export type AdminProvider = {
  adminAccount?: IAdminAccount;
  setAdminAccount: (_: IAdminAccount) => void;
  getIdentity?: () => Promise<UserIdentity>;
  authProvider: AuthProvider;
};

export type AdminResourcesProvider = {
  resources: ResourcePropDict;
  resourceViews: Record<string, Record<string, any>>;
  i18nProvider: I18nProvider;
  dataProvider?: DataProvider;
};

export interface IAdminAccount {
  id: string;
  email: string;
  name: string;
  routes: IAdminRoute[];
}

export interface IAdminRoute {
  resource: string;
  methods: Array<'list' | 'create' | 'edit' | 'delete' | 'show' | 'all'>;
  plugin: string;
  options: Record<string, any>;
  roles: string[];
  path: string;
}

export interface IAdminPlugin {
  name: string;
  i18n?: TranslationPartial;
  resolveRoutes: (
    route: IAdminRoute,
    options: { headers: Record<string, any> },
  ) => {
    resourceProps: [string, ResourceProps][];
    resourceDataRoutes: [string, DataProvider][];
    resourceMethodDataRoutes: [string, string, (resource: string, params: any) => Promise<any>][];
    resourceViews: [string, string, ViewComponent][];
  };
}
