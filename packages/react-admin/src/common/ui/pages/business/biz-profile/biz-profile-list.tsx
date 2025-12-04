import { List, Datagrid, TextField, DateField, TextInput, SelectInput } from 'react-admin';

import { BizProfileState } from '~common/enums/BizProfileState';

const postFilters = [
  <TextInput source="name" label="Profile Name" alwaysOn />,
  <TextInput source="bizOrganizationName" label="Organization Name" alwaysOn />,
  <SelectInput
    source="status"
    label="Status"
    choices={Object.values(BizProfileState).map((status) => ({
      id: status,
      name: status,
    }))}
    alwaysOn
  />,
];

export const BizProfileList = () => {
  return (
    <List filters={postFilters}>
      <Datagrid bulkActionButtons={false} rowClick="show">
        <TextField source="name" />
        <TextField source="bizOrganizationName" label="Organization Name" sortable={false} />
        <TextField source="jobTitle" />
        <TextField source="status" sortable={false} />
        <DateField source="createdAt" />
        <DateField source="updatedAt" />
      </Datagrid>
    </List>
  );
};
