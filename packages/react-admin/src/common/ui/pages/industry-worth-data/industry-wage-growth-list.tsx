import { Button } from '@mui/material';
import { Datagrid, List, TextField, useDataProvider, useNotify, TopToolbar } from 'react-admin';

export const IndustryWageGrowthList = () => {
  const dataProvider = useDataProvider();
  const notify = useNotify();

  const handlePopulate = async () => {
    try {
      await dataProvider.populate('industry-wage-growth', {});
      notify('Job enqueued', { type: 'success' });
    } catch (error) {
      console.error(error);
      notify('Failed to enqueue job', { type: 'error' });
    }
  };

  const ListActions = () => (
    <TopToolbar>
      <Button onClick={handlePopulate}>Populate</Button>
    </TopToolbar>
  );

  return (
    <List actions={<ListActions />} empty={false}>
      <Datagrid bulkActionButtons={false}>
        <TextField source="fredSeriesId" />
        <TextField source="industryTitle" />
        <TextField source="mean" />
        <TextField source="standardDeviation" />
        <TextField source="zScore" />
        <TextField source="fredSeriesLastUpdated" />
      </Datagrid>
    </List>
  );
};
