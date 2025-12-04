import {
  DeleteButton,
  Edit,
  SaveButton,
  SimpleForm,
  TextInput,
  Toolbar,
  useShowController,
  SelectArrayInput,
} from 'react-admin';

const UserRoles = [
  { id: 'USER', name: 'User' },
  { id: 'ADMIN', name: 'Admin' },
];

export const UserEdit = () => {
  const { record } = useShowController();
  const isAdmin = record?.roles?.includes('ADMIN');

  const EditActions = () => (
    <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <SaveButton />
      {!isAdmin && <DeleteButton />}
    </Toolbar>
  );

  return (
    <Edit emptyWhileLoading mutationMode={'pessimistic'}>
      <SimpleForm toolbar={<EditActions />}>
        <TextInput source="name" />
        <SelectArrayInput source="roles" choices={UserRoles} />
      </SimpleForm>
    </Edit>
  );
};
