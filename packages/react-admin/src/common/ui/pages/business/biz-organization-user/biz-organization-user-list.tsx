import { Button, Dialog, DialogTitle, DialogContent } from '@mui/material';
import { useState } from 'react';
import {
  Datagrid,
  List,
  TextField,
  TopToolbar,
  SimpleForm,
  TextInput,
  required,
  email,
  SaveButton,
  useDataProvider,
  useNotify,
  DateField,
  DeleteButton,
  useRefresh,
} from 'react-admin';

const AddUserForm = ({ onClose, orgId }: { onClose: () => void; orgId: string }) => {
  const notify = useNotify();
  const dataProvider = useDataProvider();
  const refresh = useRefresh();

  const handleSubmit = async (values: any) => {
    const body = {
      email: values.userEmail,
      bizOrganizationId: orgId,
    };

    try {
      await dataProvider.create('biz-organization-user', { data: body });
      onClose();
      notify('User added successfully', { type: 'success' });
      refresh();
    } catch (error) {
      console.error('Add user error:', error);
      notify(error instanceof Error ? error.message : 'Failed to add user', { type: 'error' });
    }
  };

  return (
    <SimpleForm onSubmit={handleSubmit} toolbar={<SaveButton alwaysEnable label="Add Admin User" />}>
      <TextInput source="userEmail" label="Email" validate={[required(), email()]} fullWidth defaultValue="" />
    </SimpleForm>
  );
};

const OrgUserActions = ({ orgId }: { orgId: string }) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <TopToolbar>
      <Button onClick={() => setDialogOpen(true)}>Add Admin User</Button>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth>
        <DialogTitle>Add AdminUser</DialogTitle>
        <DialogContent>
          <AddUserForm onClose={() => setDialogOpen(false)} orgId={orgId} />
        </DialogContent>
      </Dialog>
    </TopToolbar>
  );
};

export const BizOrganizationUserList = (props: any) => {
  const { orgId } = props;

  return (
    <div>
      <List
        title={props.title}
        resource="biz-organization-user"
        filter={{ bizOrganizationId: orgId }}
        empty={false}
        exporter={false}
        actions={<OrgUserActions orgId={orgId} />}
      >
        <Datagrid bulkActionButtons={false} rowClick={false}>
          <TextField source="bizUser.email" sortable={false} />
          <TextField source="status" sortable={false} />
          <TextField source="role" sortable={false} />
          <DateField source="invitedAt" sortable={false} />
          <DateField source="joinedAt" sortable={false} />
          <DeleteButton mutationMode="pessimistic" redirect={false} />
        </Datagrid>
      </List>
    </div>
  );
};
