import { List, Datagrid, TextField, DateField, TextInput, SelectInput, BooleanField } from 'react-admin';

const postFilters = [
  <TextInput source="userEmail" label="User Email" alwaysOn />,
  <TextInput source="endorserEmail" label="Endorser Email" alwaysOn />,
  <SelectInput
    source="status"
    label="Status"
    choices={[
      { id: 'REQUESTED', name: 'REQUESTED' },
      { id: 'PENDING_APPROVAL', name: 'PENDING_APPROVAL' },
      { id: 'APPROVED', name: 'APPROVED' },
      { id: 'REJECTED', name: 'REJECTED' },
      { id: 'IGNORED', name: 'IGNORED' },
    ]}
    alwaysOn
  />,
  <SelectInput
    source="visible"
    label="Visible"
    choices={[
      { id: true, name: 'Yes' },
      { id: false, name: 'No' },
    ]}
    alwaysOn
  />,
];

export const EndorsementList = () => {
  return (
    <List filters={postFilters}>
      <Datagrid bulkActionButtons={false} rowClick="show">
        <TextField source="userEmail" label="User Email" />
        <TextField source="endorserEmail" label="Endorser Email" />
        <TextField source="userName" label="User Name" sortable={false} />
        <TextField source="endorserName" label="Endorser Name" sortable={false} />
        <TextField source="status" />
        <TextField source="relationship" sortable={false} />
        <BooleanField source="visible" sortable={false} />
        <DateField source="createdAt" />
        <DateField source="statusChangedAt" />
      </Datagrid>
    </List>
  );
};
