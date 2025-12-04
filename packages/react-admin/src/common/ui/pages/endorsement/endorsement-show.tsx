import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button } from '@mui/material';
import {
  Show,
  SimpleShowLayout,
  TextField,
  DateField,
  BooleanField,
  useShowController,
  useDataProvider,
  useNotify,
  useRedirect,
} from 'react-admin';

const ActionButtons = () => {
  const { record } = useShowController();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const redirect = useRedirect();

  const handleDelete = async () => {
    if (!record) {
      return;
    }

    if (!confirm(`Are you sure you want to delete this endorsement? This action cannot be undone.`)) {
      return;
    }

    try {
      await dataProvider.delete('endorsement', {
        id: record.id,
        previousData: record,
      });
      notify('Endorsement deleted successfully', { type: 'success' });
      redirect('/endorsement');
    } catch (error) {
      notify('Failed to delete endorsement', { type: 'error' });
      console.error('Delete error:', error);
    }
  };

  if (!record) {
    return null;
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <Button onClick={handleDelete} variant="contained" color="error" startIcon={<DeleteIcon />}>
        Delete
      </Button>
    </div>
  );
};

export const EndorsementShow = () => {
  const { record } = useShowController();

  if (!record) {
    return null;
  }

  return (
    <Show>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <SimpleShowLayout>
          <TextField source="id" label="ID" emptyText="N/A" />
          
          <TextField source="userName" label="User Name" emptyText="N/A" />
          <TextField source="userEmail" label="User Email" emptyText="N/A" />
          
          <TextField source="endorserName" label="Endorser Name" emptyText="N/A" />
          <TextField source="endorserEmail" label="Endorser Email" emptyText="N/A" />
          
          <TextField source="status" label="Status" emptyText="N/A" />
          <DateField source="statusChangedAt" label="Status Changed At" showTime emptyText="N/A" />
          
          <TextField source="relationship" label="Relationship" emptyText="N/A" />
          <TextField source="content" label="Content" emptyText="N/A" />
          
          <BooleanField source="visible" label="Visible" />
          
          <DateField source="createdAt" label="Created At" showTime emptyText="N/A" />
          <DateField source="updatedAt" label="Updated At" showTime emptyText="N/A" />

          <ActionButtons />
        </SimpleShowLayout>
      </Box>
    </Show>
  );
};
