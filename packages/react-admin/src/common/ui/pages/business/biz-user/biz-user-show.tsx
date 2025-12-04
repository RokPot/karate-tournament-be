import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField as MuiTextField,
  Box,
} from '@mui/material';
import { useContext, useState, useEffect } from 'react';
import { Button, Show, SimpleShowLayout, TextField, useNotify, useShowController, useDataProvider } from 'react-admin';

import { AuthnContext } from '~common/authn/authn.helpers';
import { impersonateBizUser } from '~common/authn/authn.impersonate';

export const BizUserShow = () => {
  const { record } = useShowController();
  const [isImpersonateOpen, setIsImpersonateOpen] = useState(false);
  const [selectedImpersonatorId, setSelectedImpersonatorId] = useState('');
  const [bizUsers, setBizUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [emailFilter, setEmailFilter] = useState('');
  const { authnToken } = useContext(AuthnContext);
  const notify = useNotify();
  const dataProvider = useDataProvider();

  useEffect(() => {
    if (isImpersonateOpen && record) {
      // Clear selected user when actively filtering (not on initial load)
      if (emailFilter) {
        setSelectedImpersonatorId('');
      }

      // Set loading immediately when filter changes
      setIsLoadingUsers(true);

      // Debounce the API call to avoid too many requests while typing
      const debounceTimer = setTimeout(() => {
        // Fetch biz users with email filter
        const fetchBizUsers = async () => {
          try {
            const filter: any = {};

            // Add email filter if provided
            if (emailFilter) {
              filter.email = emailFilter;
            }

            const response = await dataProvider.getList('biz-user', {
              pagination: { page: 1, perPage: 1000 },
              sort: { field: 'email', order: 'ASC' },
              filter,
            });

            // Filter out the current user
            const otherUsers = response.data.filter((user) => user.id !== record.id);
            setBizUsers(otherUsers);
          } catch (error) {
            console.error('Failed to fetch biz users:', error);
            notify('Failed to fetch users', { type: 'error' });
          } finally {
            setIsLoadingUsers(false);
          }
        };

        fetchBizUsers();
      }, 300); // 300ms debounce

      // Cleanup function to clear the timeout
      return () => clearTimeout(debounceTimer);
    }
  }, [isImpersonateOpen, record, dataProvider, notify, emailFilter]);

  const handleImpersonateClose = () => {
    setIsImpersonateOpen(false);
    setSelectedImpersonatorId('');
    setBizUsers([]);
    setIsLoadingUsers(false);
    setEmailFilter('');
  };

  const handleImpersonateSubmit = async () => {
    if (!selectedImpersonatorId) {
      notify('Please select an impersonator', { type: 'warning' });
      return;
    }

    await impersonateBizUser(selectedImpersonatorId, record.id, authnToken, (error) => {
      notify(error.message, { type: 'warning' });
    });

    notify(`Impersonation would start with user ID: ${selectedImpersonatorId}`, { type: 'info' });
    handleImpersonateClose();
  };

  return (
    <Show>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <SimpleShowLayout>
          <TextField source="name" />
          <TextField source="email" />
          <TextField source="createdAt" />
          <TextField source="updatedAt" />
        </SimpleShowLayout>

        <SimpleShowLayout style={{ backgroundColor: '#353434', padding: '10px' }}>
          <Button onClick={() => setIsImpersonateOpen(true)} label="Impersonate" />
        </SimpleShowLayout>
      </div>

      <Dialog open={isImpersonateOpen} onClose={handleImpersonateClose}>
        <DialogTitle>Impersonate User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Since biz users dont login to admin, please select a user who will be impersonating this user.
          </DialogContentText>

          <Box style={{ marginTop: '16px' }}>
            <MuiTextField
              fullWidth
              label="Filter by email"
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              placeholder="Type to filter by email..."
              variant="outlined"
              size="small"
              style={{ marginBottom: '16px' }}
            />
          </Box>

          <FormControl fullWidth>
            <InputLabel id="impersonator-select-label">Select Impersonator</InputLabel>
            <Select
              labelId="impersonator-select-label"
              value={selectedImpersonatorId}
              label="Select Impersonator"
              onChange={(event) => setSelectedImpersonatorId(event.target.value as string)}
              disabled={isLoadingUsers}
            >
              {isLoadingUsers ? (
                <MenuItem disabled>Loading users...</MenuItem>
              ) : bizUsers.length === 0 ? (
                <MenuItem disabled>No other users available</MenuItem>
              ) : (
                bizUsers.map((user: any) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.email}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleImpersonateClose} label="Cancel" />
          <Button
            onClick={handleImpersonateSubmit}
            label="Submit"
            color="primary"
            disabled={isLoadingUsers || !selectedImpersonatorId}
          />
        </DialogActions>
      </Dialog>
    </Show>
  );
};
