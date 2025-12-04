import en from 'ra-language-english';

import { AdminContextProvider } from '~common/admin/components/admin-context.provider';
import { AdminResourcesProvider } from '~common/admin/components/admin-resources.provider';
import { OrionAdminUi } from '~common/admin/components/orion-admin-ui';
import { AuthnContextProvider } from '~common/authn/components/authn-context.provider';

const App = () => {
  return (
    <AuthnContextProvider>
      <AdminContextProvider>
        <AdminResourcesProvider i18nPartials={[{ en }]}>
          <OrionAdminUi></OrionAdminUi>
        </AdminResourcesProvider>
      </AdminContextProvider>
    </AuthnContextProvider>
  );
};

export default App;
