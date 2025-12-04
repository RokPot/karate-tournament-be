import { Button } from '@mui/material';
import { Datagrid, List, TextField, TopToolbar, useDataProvider, useNotify } from 'react-admin';

export const WatchlistList = () => {
  const notify = useNotify();
  const dataProvider = useDataProvider();

  const populateWatchlist = async () => {
    try {
      await dataProvider.populate('watchlist', {
        data: {},
      });
      notify('Job request sent', { type: 'success' });
    } catch (error) {
      console.error(error);
      notify('Failed to request job', { type: 'error' });
    }
  };

  const ListActions = () => {
    return (
      <TopToolbar>
        <Button onClick={() => populateWatchlist()} color="primary" size="small" style={{ padding: 3 }}>
          Populate Data
        </Button>
      </TopToolbar>
    );
  };

  return (
    <List empty={false} perPage={50} actions={<ListActions />}>
      <Datagrid bulkActionButtons={false} rowClick={false}>
        <TextField source="alternateTitle" label="Alternate Title" />
        <TextField source="industry" label="Industry" />
        <TextField source="subIndustry" label="Sub Industry" />
        <TextField source="blsCode" label="BLS Code" />
        <TextField source="blsTitle" label="BLS Title" />
        <TextField source="payRatio" label="Pay Ratio" />
      </Datagrid>
    </List>
  );
};
