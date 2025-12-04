import { DataProvider, ResourceProps } from 'ra-core';
import { createContext } from 'react';
import { defaultDataProvider } from 'react-admin';

import { AuthnI18nTranslationPartial } from '~common/authn/authn.i18n';
import { config } from '~common/config';
import { RestClient } from '~common/http';
import { TranslationPartial } from '~common/i18n';

import { AdminProvider, AdminResourcesProvider, IAdminPlugin, IAdminRoute } from './admin.types';

export const AdminContext = createContext<AdminProvider>({} as AdminProvider);
export const AdminResourcesContext = createContext<AdminResourcesProvider>({} as AdminResourcesProvider);

export const AdminRest = new RestClient(config.apiBaseUrl);

export type ResourceDataProviders = {
  resourceDataProvider?: ResourceDataProvider;
  resourceMethodDataProvider?: ResourceMethodDataProvider;
};
export type ResourceDataProvider = Record<string, DataProvider>;
export type ResourceMethodDataProvider = Record<
  string,
  Record<string, (resource: string, params: any) => Promise<any>>
>;
export type ResourcePropDict = Record<string, Omit<ResourceProps, 'name'>>;

export async function resolveResources(props: {
  i18nPartials: TranslationPartial[];
  routes: IAdminRoute[];
  resourceDataProvider?: ResourceDataProvider;
  resourceMethodDataProvider?: ResourceMethodDataProvider;
  requestHeaders: Record<string, string>;
}) {
  const i18nPartials: TranslationPartial[] = [...props.i18nPartials, AuthnI18nTranslationPartial];
  const resources: ResourcePropDict = {};
  const resourceMethodDataProvider: ResourceMethodDataProvider = props.resourceMethodDataProvider || {};
  const resourceDataProvider: ResourceDataProvider = props.resourceDataProvider || {};
  const resourceViews: Record<string, Record<string, any>> = {};

  for (const route of props.routes || []) {
    let resolved, i18n;
    try {
      const {
        default: { i18n: _i18n, resolveRoutes },
      } = (await import(`../../plugins/${route.plugin}/index.tsx`)) as { default: IAdminPlugin };
      resolved = resolveRoutes(route, {
        headers: props.requestHeaders,
      });
      i18n = _i18n;
    } catch (e: any) {
      console.error(e);
      continue;
    }

    try {
      for (const [resource, name, view] of resolved.resourceViews) {
        if (!(resource in resourceViews)) {
          resourceViews[resource] = {};
        }
        if (name in resourceViews[resource]) {
          console.error(`Duplicate view: ${resource}:${name}`);
        }
        resourceViews[resource][name] = view;
      }
    } catch (e: any) {
      console.error(e);
    }

    for (const [resource, resourceProps] of resolved.resourceProps) {
      if (!(resource in resources)) {
        resources[resource] = {};
      }
      resources[resource] = {
        ...resources[resource],
        ...resourceProps,
        options: { ...(resources[resource]?.options || {}), ...(resourceProps.options || {}) },
      };
    }

    for (const [resource, dataProvider] of resolved.resourceDataRoutes) {
      if (resource in resourceDataProvider) {
        console.error(`Duplicate resource: ${resource}`);
      }
      resourceDataProvider[resource] = dataProvider;
    }

    for (const [resource, method, dataProvider] of resolved.resourceMethodDataRoutes) {
      if (!(resource in resourceMethodDataProvider)) {
        resourceMethodDataProvider[resource] = {};
      }
      if (method in resourceMethodDataProvider[resource]) {
        console.error(`Duplicate method: ${resource}:${method}`);
      }
      resourceMethodDataProvider[resource][method] = dataProvider;
    }

    if (i18n) {
      i18nPartials.push(i18n);
    }
  }

  return {
    i18nPartials,
    resources,
    resourceViews,
    resourceDataProviders: {
      resourceDataProvider,
      resourceMethodDataProvider,
    },
  };
}

export function dataProviderFactory(rdp: ResourceDataProviders): DataProvider {
  return new Proxy(defaultDataProvider, {
    get: (_target: DataProvider, method: string) => {
      return (resource: string, params: any) => {
        if (method === 'supportAbortSignal') {
          // todo, abort support ?
          return false;
        }
        if (
          rdp?.resourceMethodDataProvider &&
          resource in rdp.resourceMethodDataProvider &&
          method in rdp.resourceMethodDataProvider[resource]
        ) {
          return rdp.resourceMethodDataProvider[resource][method](resource, params);
        }
        if (rdp?.resourceDataProvider && resource in rdp.resourceDataProvider) {
          return rdp.resourceDataProvider[resource][method](resource, params);
        }
        throw new Error(`Unknown resource: ${resource}:${method}`);
      };
    },
  }) as DataProvider;
}
