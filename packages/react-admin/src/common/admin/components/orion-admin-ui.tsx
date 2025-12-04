import { ReactNode, useContext } from 'react';
import { AdminContext as RaAdminContext, AdminUI, CustomRoutes, Resource, Layout } from 'react-admin';
import { Route } from 'react-router-dom';

import AuthnLogin from '~common/authn/components/authn-login';
import { AdminActionsPage } from '~common/ui/pages/admin-actions/admin-actions-page';
import { NotificationSendPage } from '~common/ui/pages/notification/notification-send-page';
import { PersonaPage } from '~common/ui/pages/persona/persona-page';

import { AdminContext, AdminResourcesContext } from '../admin.helpers';

import { AdminMenu } from './admin-menu';
import Ready from './admin-ready';

export function OrionAdminUi(props: {
  // extra resources
  children?: ReactNode;
}) {
  const { authProvider } = useContext(AdminContext);
  const { resources, i18nProvider, dataProvider } = useContext(AdminResourcesContext);

  const handleResource = (name: string, resource: any) => {
    return <Resource name={name} {...resource} key={name} />;
  };

  const layout = (props: any) => {
    return <Layout menu={AdminMenu}>{props.children}</Layout>;
  };

  return (
    <RaAdminContext authProvider={authProvider} i18nProvider={i18nProvider} dataProvider={dataProvider}>
      <AdminUI disableTelemetry={true} ready={Ready} requireAuth={true} loginPage={AuthnLogin} layout={layout}>
        {Object.entries(resources).map(([name, resource]) => {
          return handleResource(name, resource);
        })}
        {props.children}
        <CustomRoutes>
          <Route path="/persona" element={<PersonaPage />} />
          <Route path="/admin-actions" element={<AdminActionsPage />} />
          <Route path="/notification/send" element={<NotificationSendPage />} />
        </CustomRoutes>
      </AdminUI>
    </RaAdminContext>
  );
}
