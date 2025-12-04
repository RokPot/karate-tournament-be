import {
  DeleteButton,
  Edit,
  SaveButton,
  SimpleForm,
  TextInput,
  Toolbar,
  SelectInput,
  DateTimeInput,
  required,
} from 'react-admin';

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

export const LiveShowEdit = () => {
  const EditActions = () => (
    <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <SaveButton />
      <DeleteButton />
    </Toolbar>
  );

  return (
    <Edit emptyWhileLoading mutationMode={'pessimistic'} redirect="show">
      <SimpleForm toolbar={<EditActions />}>
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
          fullWidth
        />
        <SelectInput source="status" label="Status" choices={LiveShowStatuses} fullWidth />
      </SimpleForm>
    </Edit>
  );
};
