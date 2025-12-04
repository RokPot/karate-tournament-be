import { Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useMemo, useState } from 'react';
import {
  Datagrid,
  List,
  NumberField,
  TextField,
  TopToolbar,
  useNotify,
  SimpleForm,
  SaveButton,
  useDataProvider,
  FilterButton,
  TextInput,
  SelectInput,
  required,
} from 'react-admin';

const generateYearOptions = () => {
  return [{ id: '2024', name: '2024' }];
};

const PopulateForm = ({ onClose }: { onClose: () => void }) => {
  const yearOptions = useMemo(() => generateYearOptions(), []);
  const notify = useNotify();
  const dataProvider = useDataProvider();

  const handleSubmit = async (data: any) => {
    try {
      await dataProvider.populate('bls-wage-data-by-area', {
        data: {
          dataType: data.dataType,
          year: data.year,
        },
      });
      notify('Job request sent', { type: 'success' });
      onClose();
    } catch (error) {
      console.error(error);
      notify('Failed to request job', { type: 'error' });
    }
  };

  return (
    <SimpleForm onSubmit={handleSubmit} defaultValues={{ dataType: 'msa' }} toolbar={<SaveButton />}>
      <SelectInput
        source="dataType"
        label="Data type"
        alwaysOn
        size="small"
        choices={['msa', 'bos', 'national']}
        validate={[required()]}
      />
      <SelectInput source="year" label="Year" alwaysOn size="small" choices={yearOptions} validate={[required()]} />
    </SimpleForm>
  );
};

const ListActions = () => {
  const [populateDialogVisible, setPopulateDialogVisible] = useState(false);

  return (
    <TopToolbar>
      <FilterButton />

      <Button onClick={() => setPopulateDialogVisible(true)} color="primary" size="small" style={{ padding: 3 }}>
        Populate Data
      </Button>

      <Dialog
        open={populateDialogVisible}
        onClose={() => !populateDialogVisible || setPopulateDialogVisible(false)}
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle>Populate Data</DialogTitle>
        <DialogContent>
          <PopulateForm onClose={() => setPopulateDialogVisible(false)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPopulateDialogVisible(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </TopToolbar>
  );
};

const blsWageDataByAreaFilters = [
  <TextInput source="areaTitle" label="Area Title" alwaysOn size="small" />,
  <TextInput source="year" label="Year" alwaysOn size="small" />,
  <SelectInput
    source="uploadedFromFileType"
    label="Data type"
    alwaysOn
    size="small"
    choices={['msa', 'bos', 'national']}
  />,
  <TextInput source="jobTitle" label="Job Title" alwaysOn size="small" />,
];

export const BlsWageDataByAreaList = () => {
  return (
    <List
      empty={false}
      actions={<ListActions />}
      filters={blsWageDataByAreaFilters}
      perPage={50}
      sort={{ field: 'areaTitle', order: 'ASC' }}
    >
      <Datagrid bulkActionButtons={false} rowClick={false}>
        <TextField source="oewsAreaCode" label="Area Code" />
        <TextField source="areaTitle" label="Area Title" />
        <TextField source="jobTitle" label="Job Title" />
        <NumberField source="annualMeanWage" label="Annual Mean Wage" />
        <NumberField source="adjustedAnnualMeanWage" label="Adjusted Annual Mean Wage" />
        <TextField source="year" label="Year" />
        <TextField source="uploadedFromFileType" label="Data type" />
      </Datagrid>
    </List>
  );
};
