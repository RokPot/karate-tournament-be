import { DataProvider, ResourceProps } from 'ra-core';

import { IAdminPlugin, IAdminRoute } from '~common/admin/admin.types';
import { config } from '~common/config';
import { RestClient } from '~common/http';
import { resolveViewComponent, ViewComponent } from '~common/ui/view-component';

import { simpleApiDataProviderMethods, post } from './simple-api.data-provider';

export default {
  name: 'simple-api',
  resolveRoutes: (route: IAdminRoute, options: { headers: Record<string, any> }) => {
    const resourceDataRoutes: [string, DataProvider][] = [];
    const resourceMethodDataRoutes: [string, string, (resource: string, params: any) => Promise<any>][] = [];
    const resourceProps: [string, ResourceProps][] = [];
    const { label, methods, views } = route.options || {};

    const resourceOptions: ResourceProps['options'] = {};
    if (label) {
      resourceOptions.label = label;
    }

    if (views) {
      resourceProps.push([
        route.resource,
        {
          name: route.resource,
          options: resourceOptions,
          ...Object.fromEntries(
            Object.entries(views)
              .filter(([name]) => ['list', 'show', 'edit', 'create'].includes(name))
              .map(([name, view]) => [name, resolveViewComponent(route.resource, name, view as ViewComponent)]),
          ),
        },
      ]);
    }

    const httpClient = new RestClient(config.apiBaseUrl, () => options.headers);

    for (const method of Array.isArray(methods) ? methods : [methods]) {
      switch (method) {
        case 'all': {
          resourceDataRoutes.push([
            route.resource,
            Object.fromEntries(
              Object.entries(simpleApiDataProviderMethods).map(([name, fn]) => [name, fn(httpClient, route.path)]),
            ) as DataProvider,
          ]);
          break;
        }
        default: {
          if (method in simpleApiDataProviderMethods) {
            resourceMethodDataRoutes.push([
              route.resource,
              method,
              simpleApiDataProviderMethods[method as keyof typeof simpleApiDataProviderMethods](httpClient, route.path),
            ]);
            break;
          }

          // custom function
          resourceMethodDataRoutes.push([route.resource, method, post(httpClient, route.path)]);
          break;
        }
      }
    }

    return {
      resourceDataRoutes,
      resourceMethodDataRoutes,
      resourceProps,
      resourceViews: views
        ? Object.entries(views).map(([name, view]) => [route.resource, name, view as ViewComponent])
        : [],
    };
  },
} satisfies IAdminPlugin;
