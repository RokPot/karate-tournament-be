import { DataProvider } from 'ra-core';
import { ReactNode, useContext, useEffect, useState } from 'react';
import { I18nProvider } from 'react-admin';

import { AuthnContext } from '~common/authn/authn.helpers';
import { composableI18nProvider, TranslationPartial } from '~common/i18n';

import {
  AdminContext,
  AdminResourcesContext,
  dataProviderFactory,
  resolveResources,
  ResourceDataProvider,
  ResourceMethodDataProvider,
  ResourcePropDict,
} from '../admin.helpers';

export function AdminResourcesProvider(props: {
  // extra resources
  children?: ReactNode;

  i18nPartials: TranslationPartial[];
  resourceDataProvider?: ResourceDataProvider;
  resourceMethodDataProvider?: ResourceMethodDataProvider;
  resourceDataHeaders?: Record<string, string>;
}) {
  const { authnToken } = useContext(AuthnContext);
  const { adminAccount } = useContext(AdminContext);

  const [i18nProvider, setI18nProvider] = useState<I18nProvider>(composableI18nProvider(props.i18nPartials));
  const [resources, setResources] = useState<ResourcePropDict>({});
  const [resourceViews, setResourceViews] = useState<Record<string, Record<string, any>>>({});
  const [dataProvider, setDataProvider] = useState<DataProvider>();

  const resolve = async () => {
    const resolved = await resolveResources({
      routes: adminAccount?.routes || [],
      i18nPartials: props.i18nPartials,
      resourceDataProvider: props.resourceDataProvider,
      resourceMethodDataProvider: props.resourceMethodDataProvider,
      requestHeaders: {
        Authorization: `Bearer ${authnToken?.accessToken}`,
        ...props.resourceDataHeaders,
      },
    });
    setResources(resolved.resources);
    setResourceViews(resolved.resourceViews);
    setDataProvider(dataProviderFactory(resolved.resourceDataProviders));
    setI18nProvider(composableI18nProvider(resolved.i18nPartials));
  };

  useEffect(() => {
    resolve().catch(console.error);
  }, [props.resourceMethodDataProvider, props.resourceDataProvider, props.i18nPartials, adminAccount?.routes]);

  return (
    <AdminResourcesContext.Provider
      value={{
        resources,
        resourceViews,
        i18nProvider,
        dataProvider,
      }}
    >
      {props.children}
    </AdminResourcesContext.Provider>
  );
}
