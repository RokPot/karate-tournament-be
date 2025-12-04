import { Edit, SimpleForm, TextInput, required, Toolbar, SaveButton } from 'react-admin';

const EditToolbar = () => (
  <Toolbar>
    <SaveButton />
  </Toolbar>
);

export const BizOrganizationEdit = () => {
  return (
    <Edit title="Edit Biz Organization">
      <SimpleForm toolbar={<EditToolbar />}>
        <TextInput source="name" validate={[required()]} fullWidth />
      </SimpleForm>
    </Edit>
  );
};
