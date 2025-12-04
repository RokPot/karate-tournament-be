import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { IconButton, Tooltip } from '@mui/material';
import { useContext } from 'react';
import {
  Datagrid,
  EmailField,
  FunctionField,
  List,
  SelectInput,
  TextField,
  TextInput,
  useNotify,
  useRecordContext,
  useRefresh,
} from 'react-admin';

import { AuthnContext } from '~common/authn/authn.helpers';
import { config } from '~common/config';
import { RestClient } from '~common/http';

const ResetUsageButton = () => {
  const notify = useNotify();
  const record = useRecordContext();
  const refresh = useRefresh();
  const { authnToken } = useContext(AuthnContext);

  if (!record) {
    return null;
  }

  const httpClient = new RestClient(config.apiBaseUrl, () => ({
    Authorization: `Bearer ${authnToken?.accessToken}`,
  }));

  const handleResetAll = async () => {
    if (
      !confirm(
        `Are you sure you want to reset ALL usage data for user ${record.userEmail}? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const response = await httpClient.post(`/admin/user-usage/reset/${record.userId}`, {});
      notify(response.data.message, { type: 'success' });
      refresh();
    } catch (error) {
      console.error('Reset error:', error);
      notify('Failed to reset usage', { type: 'error' });
    }
  };

  const handleResetResource = async () => {
    if (
      !confirm(
        `Are you sure you want to reset ${record.usageResource} usage data for user ${record.userEmail}? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const response = await httpClient.post(`/admin/user-usage/reset/${record.userId}/${record.usageResource}`, {});
      notify(response.data.message, { type: 'success' });
      refresh();
    } catch (error) {
      console.error('Reset error:', error);
      notify('Failed to reset resource usage', { type: 'error' });
    }
  };

  return (
    <>
      <Tooltip title="Reset all usage for this user">
        <IconButton size="small" onClick={handleResetAll} aria-label="reset all usage" color="warning">
          <DeleteIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Reset this specific resource usage">
        <IconButton size="small" onClick={handleResetResource} aria-label="reset resource usage" color="secondary">
          <RefreshIcon />
        </IconButton>
      </Tooltip>
    </>
  );
};

const userUsageFilters = [
  <TextInput source="email" label="User Email" alwaysOn />,
  <TextInput source="name" label="User Name" alwaysOn />,
  <SelectInput
    source="usageResource"
    label="Usage Resource"
    choices={[
      { id: 'worth_calculation', name: 'Worth Calculation' },
      { id: 'ai_chat', name: 'AI Chat' },
    ]}
    alwaysOn
  />,
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

function formatNumber<T>(value: T) {
  if (Number.isNaN(value)) {
    return 'NaN';
  }
  return Number(value).toLocaleString();
}

export const UserUsageList = () => (
  <List exporter={false} filters={userUsageFilters} sort={{ field: 'id', order: 'ASC' }}>
    <Datagrid bulkActionButtons={false} rowClick={false}>
      {idColumn}
      <EmailField source="userEmail" label="User Email" />
      <TextField source="userName" label="User Name" />
      <TextField source="usageResource" label="Resource" />
      <FunctionField
        label="Usage Count"
        source="usageCount"
        render={(record) =>
          record ? `${formatNumber(record.usageCount)} / ${formatNumber(record.dailyUsageLimit)}` : ''
        }
      />
      <FunctionField
        label="Input Tokens"
        source="inputTokens"
        render={(record) =>
          record ? `${formatNumber(record.inputTokens)} / ${formatNumber(record.dailyTokenLimit)}` : ''
        }
      />
      <FunctionField
        label="Output Tokens"
        source="outputTokens"
        render={(record) =>
          record ? `${formatNumber(record.outputTokens)} / ${formatNumber(record.dailyTokenLimit)}` : ''
        }
      />
      <ResetUsageButton />
    </Datagrid>
  </List>
);
