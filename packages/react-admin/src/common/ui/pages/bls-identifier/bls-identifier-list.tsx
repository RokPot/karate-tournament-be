import { Datagrid, DeleteButton, EditButton, List, TextField, TextInput } from 'react-admin';

export const BlsIdentifierList = () => {
  const postFilters = [
    <TextInput source="jobName" label="Job Name" alwaysOn />,
    <TextInput source="blsTitle" label="BLS Title" alwaysOn />,
  ];

  return (
    <List filters={postFilters}>
      <Datagrid bulkActionButtons={false}>
        <TextField source="jobName" label="Job Name" />
        <TextField source="blsTitle" label="BLS Title" />
        <EditButton />
        <DeleteButton />
      </Datagrid>
    </List>
  );
};
