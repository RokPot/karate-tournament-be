import { List, Datagrid, TextField, DateField, ShowButton, TextInput, EmailField } from 'react-admin';

const bizUserFilters = [<TextInput source="email" label="Email" alwaysOn />];

export const BizUserList = () => {
  return (
    <List exporter={false} empty={false} filters={bizUserFilters}>
      <Datagrid bulkActionButtons={false}>
        <TextField source="id" label="ID" />
        <TextField source="name" label="Name" />
        <EmailField source="email" />
        <DateField source="createdAt" label="Created At" />
        <ShowButton />
      </Datagrid>
    </List>
  );
};
