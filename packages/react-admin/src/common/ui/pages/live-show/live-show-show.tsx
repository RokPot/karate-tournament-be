import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Link, Button } from '@mui/material';
import {
  Show,
  SimpleShowLayout,
  TextField,
  DateField,
  useShowController,
  FunctionField,
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

    if (!confirm(`Are you sure you want to delete the live show "${record.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await dataProvider.delete('live-show', {
        id: record.id,
        previousData: record,
      });
      notify('Live show deleted successfully', { type: 'success' });
      redirect('/live-show');
    } catch (error) {
      notify('Failed to delete live show', { type: 'error' });
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

export const LiveShowShow = () => {
  const { record } = useShowController();

  if (!record) {
    return null;
  }

  return (
    <Show>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <SimpleShowLayout>
          <TextField source="title" label="Title" emptyText="N/A" />
          <TextField source="description" label="Description" emptyText="N/A" />
          <FunctionField
            label="Thumbnail URL"
            source="thumbnailUrl"
            render={(record) =>
              record?.thumbnailUrl ? (
                <Box>
                  <Link href={record.thumbnailUrl} target="_blank" rel="noopener noreferrer">
                    {record.thumbnailUrl}
                  </Link>
                  <br />
                  <img
                    src={record.thumbnailUrl}
                    alt="Thumbnail"
                    style={{ maxWidth: '200px', maxHeight: '150px', marginTop: '8px' }}
                  />
                </Box>
              ) : (
                'N/A'
              )
            }
          />

          <TextField source="provider" label="Provider" emptyText="N/A" />
          <TextField source="externalId" label="External ID" emptyText="N/A" />

          <FunctionField
            label="External URL"
            source="externalUrl"
            render={(record) =>
              record?.externalUrl ? (
                <Link href={record.externalUrl} target="_blank" rel="noopener noreferrer">
                  {record.externalUrl}
                </Link>
              ) : (
                'N/A'
              )
            }
          />
          <FunctionField
            label="External Chat URL"
            source="externalChatUrl"
            render={(record) =>
              record?.externalChatUrl ? (
                <Link href={record.externalChatUrl} target="_blank" rel="noopener noreferrer">
                  {record.externalChatUrl}
                </Link>
              ) : (
                'N/A'
              )
            }
          />
          <FunctionField
            label="External Embed URL"
            source="externalEmbedUrl"
            render={(record) =>
              record?.externalEmbedUrl ? (
                <Link href={record.externalEmbedUrl} target="_blank" rel="noopener noreferrer">
                  {record.externalEmbedUrl}
                </Link>
              ) : (
                'N/A'
              )
            }
          />

          <DateField source="scheduledStartAt" label="Scheduled Start" showTime emptyText="N/A" />
          <DateField source="scheduledEndAt" label="Scheduled End" showTime emptyText="N/A" />

          <TextField source="category" label="Category" emptyText="N/A" />
          <TextField source="status" label="Status" emptyText="N/A" />

          <DateField source="createdAt" label="Created At" showTime emptyText="N/A" />
          <DateField source="updatedAt" label="Updated At" showTime emptyText="N/A" />

          <ActionButtons />
        </SimpleShowLayout>
      </Box>
    </Show>
  );
};
