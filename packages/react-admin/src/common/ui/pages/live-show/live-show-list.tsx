import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import { useState } from 'react';
import {
  Datagrid,
  DateField,
  List,
  TextField,
  useRecordContext,
  TextInput,
  FunctionField,
  SelectInput,
  DateInput,
  TopToolbar,
  CreateButton,
  useDataProvider,
  useNotify,
  useRefresh,
} from 'react-admin';
import { useNavigate } from 'react-router-dom';

const LiveShowActionsMenu = () => {
  const record = useRecordContext();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const refresh = useRefresh();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = async () => {
    if (!record) {
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete the live show "${record.title}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await dataProvider.delete('live-show', {
        id: record.id,
        previousData: record,
      });
      notify('Live show deleted successfully', { type: 'success' });
      refresh();
      handleMenuClose();
    } catch (error) {
      notify('Failed to delete live show', { type: 'error' });
      console.error('Delete error:', error);
    }
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
            navigate(`/live-show/${record.id}/show`);
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
            navigate(`/live-show/${record.id}/edit`);
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Edit" />
        </MenuItem>
        {record.externalUrl && (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              window.open(record.externalUrl, '_blank');
            }}
          >
            <ListItemIcon>
              <PlayArrowIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Watch" />
          </MenuItem>
        )}
        <MenuItem
          onClick={handleDelete}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>
    </>
  );
};

const liveShowFilters = [
  <TextInput source="title" label="Title" alwaysOn />,
  <SelectInput
    source="provider"
    label="Provider"
    choices={[
      { id: 'youtube', name: 'YouTube' },
    ]}
    alwaysOn
  />,
  <SelectInput
    source="category"
    label="Category"
    choices={[
      { id: 'FREE', name: 'Free' },
      { id: 'PREMIUM', name: 'Premium' },
    ]}
    alwaysOn
  />,
  <SelectInput
    source="status"
    label="Status"
    choices={[
      { id: 'SCHEDULED', name: 'Scheduled' },
      { id: 'LIVE', name: 'Live' },
      { id: 'ENDED', name: 'Ended' },
      { id: 'CANCELLED', name: 'Cancelled' },
    ]}
    alwaysOn
  />,
  <DateInput source="scheduledAfter" label="Scheduled After" />,
  <DateInput source="scheduledBefore" label="Scheduled Before" />,
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

const ListActions = () => {
  return (
    <TopToolbar>
      <CreateButton />
    </TopToolbar>
  );
};

export const LiveShowList = () => (
  <List exporter={false} filters={liveShowFilters} actions={<ListActions />}>
    <Datagrid bulkActionButtons={false} rowClick={false}>
      {idColumn}
      <TextField source="title" label="Title" />
      <TextField source="category" label="Category" />
      <TextField source="status" label="Status" />
      <TextField source="provider" label="Provider" />
      <DateField source="scheduledStartAt" label="Scheduled Start" showTime />
      <DateField source="scheduledEndAt" label="Scheduled End" showTime />
      <DateField source="createdAt" label="Created At" />
      <LiveShowActionsMenu />
    </Datagrid>
  </List>
);
