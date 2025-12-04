import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import { useState, useContext } from 'react';
import {
  Datagrid,
  DateField,
  EmailField,
  List,
  TextField,
  useRecordContext,
  TextInput,
  useNotify,
  FunctionField,
} from 'react-admin';
import { useNavigate } from 'react-router-dom';

import { AuthnContext } from '~common/authn/authn.helpers';
import { impersonateUser } from '~common/authn/authn.impersonate';

const UserActionsMenu = () => {
  const notify = useNotify();
  const record = useRecordContext();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const { authnToken } = useContext(AuthnContext);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  if (!record) {
    return null;
  }

  return (
    <>
      <IconButton size="small" onClick={handleMenuOpen} aria-label="actions">
        <MoreVertIcon />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            navigate(`/user/${record.id}/show`);
          }}
        >
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Show" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            navigate(`/user/${record.id}/edit`);
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Edit" />
        </MenuItem>
        <MenuItem
          onClick={async () => {
            handleMenuClose();
            await impersonateUser(record.id.toString(), authnToken, (error) => {
              notify(error.message, { type: 'warning' });
            });
          }}
        >
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Impersonate" />
        </MenuItem>
      </Menu>
    </>
  );
};

const userFilters = [
  <TextInput source="name" label="Name" alwaysOn />,
  <TextInput source="email" label="Email" alwaysOn />,
];

const idColumn = (
  <FunctionField
    label="ID"
    source="id"
    render={(record) =>
      record ? (
        <Tooltip title={record.id}>
          <span>{record.id.substring(0, 8) + '...'}</span>
        </Tooltip>
      ) : (
        ''
      )
    }
  />
);

export const UserList = () => (
  <List exporter={false} filters={userFilters}>
    <Datagrid bulkActionButtons={false} rowClick={false}>
      {idColumn}
      <TextField source="name" />
      <EmailField source="email" />
      <DateField source="createdAt" />
      <UserActionsMenu />
    </Datagrid>
  </List>
);
