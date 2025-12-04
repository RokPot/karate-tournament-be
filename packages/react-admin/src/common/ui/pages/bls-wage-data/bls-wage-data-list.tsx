import { Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useState } from 'react';
import {
  Datagrid,
  List,
  NumberField,
  TextField,
  TopToolbar,
  useNotify,
  SimpleForm,
  FileInput,
  FileField,
  SaveButton,
  useDataProvider,
} from 'react-admin';

const UploadForm = ({ onClose }: { onClose: () => void }) => {
  const notify = useNotify();
  const dataProvider = useDataProvider();

  const handleSubmit = async (values: any) => {
    try {
      if (!values.file || !values.file.rawFile) {
        notify('No file selected', { type: 'error' });
        return;
      }

      const formData = new FormData();
      formData.append('file', values.file.rawFile);
      await dataProvider.upload('bls-wage-data', formData);
      onClose();
      notify('File uploaded successfully', { type: 'success' });
    } catch (error) {
      console.error('Upload error:', error);
      notify(error instanceof Error ? error.message : 'Upload failed', { type: 'error' });
    }
  };

  return (
    <SimpleForm onSubmit={handleSubmit} toolbar={<SaveButton alwaysEnable label="Upload" />}>
      <FileInput
        source="file"
        label="JSON File"
        placeholder="Drop a file to upload, or click here to select it"
        multiple={false}
        accept={{ 'application/json': ['.json'] }}
      >
        <FileField source="src" title="title" />
      </FileInput>
    </SimpleForm>
  );
};

const ListActions = () => {
  const [open, setOpen] = useState(false);

  return (
    <TopToolbar>
      <Button onClick={() => setOpen(true)} color="primary">
        Upload JSON File
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>Upload BLS Wage Data</DialogTitle>
        <DialogContent>
          <UploadForm onClose={() => setOpen(false)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </TopToolbar>
  );
};

export const BlsWageDataList = () => {
  return (
    <List empty={false} actions={<ListActions />}>
      <Datagrid bulkActionButtons={false}>
        <TextField source="title" />
        <TextField source="matrixCode" />
        <TextField source="stateCode" />
        <NumberField source="annualMeanWage" />
      </Datagrid>
    </List>
  );
};
