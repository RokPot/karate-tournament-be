import { Box, Divider, Typography } from '@material-ui/core';
import { useState } from 'react';
import { Button, DateField, Show, SimpleShowLayout, TextField, useNotify, useShowController } from 'react-admin';

export const ProfileShow = () => {
  const { record } = useShowController();
  const notify = useNotify();
  const [revealStructureJson, setRevealStructureJson] = useState<boolean>(false);

  if (!record) {
    return null;
  }

  const handleCopyStructureJson = async () => {
    try {
      const jsonString = JSON.stringify(record?.dataV02, null, 2);
      await navigator.clipboard.writeText(jsonString);
      notify('Copied to clipboard!', { type: 'success' });
    } catch (error) {
      console.error('Failed to copy to clipboard', error);
      notify('Failed to copy to clipboard', { type: 'error' });
    }
  };

  return (
    <Show>
      <Box style={{ padding: '10px' }}>
        <Typography variant="h6">Profile</Typography>
        <SimpleShowLayout>
          <TextField source="id" />
          <TextField source="userName" />
          <TextField source="status" />
          <DateField source="updatedAt" />
        </SimpleShowLayout>
      </Box>

      <Divider />
      <Box style={{ padding: '10px' }}>
        <Typography variant="h6">Structure JSON</Typography>
        <Button
          size="small"
          style={{ marginBottom: '10px' }}
          onClick={() => setRevealStructureJson(!revealStructureJson)}
        >
          {revealStructureJson ? (
            <span style={{ fontSize: '12px' }}>Hide Structure JSON</span>
          ) : (
            <span style={{ fontSize: '12px' }}>Show Structure JSON</span>
          )}
        </Button>
        <Button size="small" style={{ marginBottom: '10px', marginLeft: '10px' }} onClick={handleCopyStructureJson}>
          <span style={{ fontSize: '12px' }}>Copy to clipboard</span>
        </Button>
        {revealStructureJson && (
          <div>
            <pre>{JSON.stringify(record?.dataV02, null, 2)}</pre>
          </div>
        )}
      </Box>
    </Show>
  );
};
