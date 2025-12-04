import { Create, SaveButton, SimpleForm, TextInput, Toolbar, SelectInput, DateTimeInput, required } from 'react-admin';

const ProviderChoices = [
  { id: 'youtube', name: 'YouTube' },
];

const LiveShowCategories = [
  { id: 'FREE', name: 'Free' },
  { id: 'PREMIUM', name: 'Premium' },
];

const LiveShowStatuses = [
  { id: 'SCHEDULED', name: 'Scheduled' },
  { id: 'LIVE', name: 'Live' },
  { id: 'ENDED', name: 'Ended' },
  { id: 'CANCELLED', name: 'Cancelled' },
];

export const LiveShowCreate = () => {
  const CreateActions = () => (
    <Toolbar sx={{ display: 'flex', justifyContent: 'flex-start' }}>
      <SaveButton />
    </Toolbar>
  );

  return (
    <Create redirect="show">
      <SimpleForm toolbar={<CreateActions />}>
        <TextInput source="title" label="Title" validate={[required()]} fullWidth />
        <TextInput source="description" label="Description" multiline rows={3} fullWidth />
        <TextInput source="thumbnailUrl" label="Thumbnail URL" fullWidth />

        <SelectInput
          source="provider"
          label="Provider"
          choices={ProviderChoices}
          validate={[required()]}
          fullWidth
        />
        <TextInput source="externalId" label="External ID" validate={[required()]} fullWidth />
        <TextInput source="externalUrl" label="External URL" validate={[required()]} fullWidth />
        <TextInput source="externalChatUrl" label="External Chat URL" fullWidth />
        <TextInput source="externalEmbedUrl" label="External Embed URL" fullWidth />

        <DateTimeInput source="scheduledStartAt" label="Scheduled Start" validate={[required()]} fullWidth />
        <DateTimeInput source="scheduledEndAt" label="Scheduled End" fullWidth />

        <SelectInput
          source="category"
          label="Category"
          choices={LiveShowCategories}
          validate={[required()]}
          defaultValue="FREE"
          fullWidth
        />
        <SelectInput source="status" label="Status" choices={LiveShowStatuses} defaultValue="SCHEDULED" fullWidth />
      </SimpleForm>
    </Create>
  );
};
