import { Button } from '@mui/material';
import { List, Datagrid, TextField, DateField, TopToolbar, Link, EditButton, ShowButton } from 'react-admin';

const ListActions = () => {
  return (
    <TopToolbar>
      <Link to="/biz-organization/create">
        <Button color="primary">Create</Button>
      </Link>
    </TopToolbar>
  );
};

export const BizOrganizationList = () => {
  return (
    <List empty={false} actions={<ListActions />}>
      <Datagrid bulkActionButtons={false}>
        <TextField source="name" />
        <DateField source="createdAt" />
        <DateField source="updatedAt" />
        <EditButton />
        <ShowButton />
      </Datagrid>
    </List>
  );
};
