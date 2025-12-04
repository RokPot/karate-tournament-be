import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import PersonIcon from '@mui/icons-material/Person';
import { Autocomplete, Checkbox, TextField, ListItemIcon, ListItemText, Typography, Box, Chip } from '@mui/material';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNotify } from 'react-admin';

import { AuthnContext } from '~common/authn/authn.helpers';
import { config } from '~common/config';
import { RestClient } from '~common/http';

import { User, UserListResponse } from './user-selector.types';

interface UserSelectorProps {
  selectedUserIds: string[];
  onSelectionChange: (userIds: string[], users: User[]) => void;
  disabled?: boolean;
}

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

export const UserSelector = ({ selectedUserIds, onSelectionChange, disabled }: UserSelectorProps) => {
  const notify = useNotify();
  const { authnToken } = useContext(AuthnContext);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const httpClient = useMemo(() => {
    return new RestClient(config.apiBaseUrl, () => ({
      Authorization: `Bearer ${authnToken.accessToken}`,
    }));
  }, [authnToken]);

  const fetchUsers = useCallback(
    async (search: string = '') => {
      setLoading(true);
      try {
        const queryParams: Record<string, string> = {
          page: '1',
          limit: '50',
        };

        if (search) {
          queryParams.search = search;
        }

        const response = await httpClient.get<UserListResponse>(`/admin/user`, { query: queryParams });
        const userData = response.data.items || [];
        setUsers(userData);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        notify('Failed to load users', { type: 'error' });
      } finally {
        setLoading(false);
      }
    },
    [httpClient, notify],
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (searchTerm) {
      const timeoutId = setTimeout(() => {
        fetchUsers(searchTerm);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [fetchUsers, searchTerm]);

  const selectedUsers = users.filter((user) => selectedUserIds.includes(user.id));

  return (
    <Box>
      <Autocomplete
        multiple
        options={users}
        disableCloseOnSelect
        disabled={disabled}
        loading={loading}
        getOptionLabel={(user) => `${user.name || 'Unknown'} (${user.email || 'No email'})`}
        value={selectedUsers}
        onChange={(_, newUsers) => {
          onSelectionChange(
            newUsers.map((user) => user.id),
            newUsers,
          );
        }}
        onInputChange={(_, newInputValue) => {
          setSearchTerm(newInputValue);
        }}
        renderOption={(props, user, { selected }) => (
          <li {...props} key={user.id}>
            <Checkbox icon={icon} checkedIcon={checkedIcon} style={{ marginRight: 8 }} checked={selected} />
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText
              primary={user.name || 'Unknown User'}
              secondary={
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    {user.email || 'No email'}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    ID: {user.id.substring(0, 8)}...
                  </Typography>
                </Box>
              }
            />
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select Users"
            placeholder="Search users by name or email..."
            helperText={`${selectedUserIds.length} user${selectedUserIds.length !== 1 ? 's' : ''} selected`}
          />
        )}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((user, index) => {
            const { key: _, ...tagProps } = getTagProps({ index });
            return <Chip key={user.id} label={user.name || user.email || 'Unknown'} {...tagProps} size="small" />;
          })
        }
      />
    </Box>
  );
};
