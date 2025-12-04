import { Datagrid, List, SelectInput, ShowButton, TextField, TextInput } from 'react-admin';

enum ProfileStatus {
  INITIALIZED = 'initialized',
  ONBOARDING = 'onboarding',
  QUEUED = 'queued',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  PROCESSING_FAILED = 'processing_failed',
}

export const ProfileList = () => {
  const postFilters = [
    <TextInput source="userName" label="User Name" alwaysOn />,
    <SelectInput
      source="status"
      label="Status"
      choices={Object.values(ProfileStatus).map((status) => ({
        id: status,
        name: status,
      }))}
      alwaysOn
    />,
  ];

  return (
    <List filters={postFilters}>
      <Datagrid bulkActionButtons={false}>
        <TextField source="userName" />
        <TextField source="status" />
        <TextField source="updatedAt" />
        <ShowButton />
      </Datagrid>
    </List>
  );
};
