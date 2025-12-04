import { DateField, Show, SimpleShowLayout, TextField } from 'react-admin';
import { useParams } from 'react-router-dom';

import { BizOrganizationUserList } from '../biz-organization-user/biz-organization-user-list';

export const BizOrganizationShow = () => {
  const { id } = useParams();

  return (
    <Show>
      <div>
        <SimpleShowLayout>
          <h2>Organization</h2>
          <TextField source="id" />
          <TextField source="name" />
          <DateField source="createdAt" />
          <DateField source="updatedAt" />
        </SimpleShowLayout>

        <hr />

        <SimpleShowLayout>
          <h2>Users</h2>
          <BizOrganizationUserList orgId={id} title={false} />
        </SimpleShowLayout>
      </div>
    </Show>
  );
};
