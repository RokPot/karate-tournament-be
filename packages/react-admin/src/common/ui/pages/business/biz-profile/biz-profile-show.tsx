import { Button } from '@mui/material';
import {
  Show,
  SimpleShowLayout,
  TextField,
  DateField,
  useRecordContext,
  useDataProvider,
  useNotify,
  useRedirect,
} from 'react-admin';

import { BizProfileState } from '~common/enums/BizProfileState';

const ActionButtons = () => {
  const record = useRecordContext();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const redirect = useRedirect();

  const handleRetry = async () => {
    if (!record) {
      return;
    }

    if (
      !confirm(
        `Are you sure you want to restart the processing pipeline for "${record.name}"? This will restart the entire processing from the beginning.`,
      )
    ) {
      return;
    }

    try {
      await dataProvider.retryProcessingPipeline('biz-profile', {
        data: { id: record.id },
        id: record.id,
      });
      notify('Pipeline retry initiated successfully', { type: 'success' });
    } catch (error) {
      notify('Failed to retry pipeline', { type: 'error' });
      console.error('Retry error:', error);
    }
  };

  const handleRetryFromFailed = async () => {
    if (!record) {
      return;
    }

    if (
      !confirm(
        `Are you sure you want to retry the processing pipeline for "${record.name}" from the failed step? This will continue processing from where it failed.`,
      )
    ) {
      return;
    }

    try {
      await dataProvider.retryProcessingFromFailedPipeline('biz-profile', {
        data: { id: record.id },
        id: record.id,
      });
      notify('Pipeline retry from failed state initiated successfully', { type: 'success' });
    } catch (error) {
      notify('Failed to retry pipeline from failed state', { type: 'error' });
      console.error('Retry from failed error:', error);
    }
  };

  const handleDelete = async () => {
    if (!record) {
      return;
    }

    if (
      !confirm(`Are you sure you want to delete the business profile "${record.name}"? This action cannot be undone.`)
    ) {
      return;
    }

    try {
      await dataProvider.delete('biz-profile', {
        id: record.id,
        previousData: record,
      });
      notify('Business profile deleted successfully', { type: 'success' });
      redirect('/biz-profile');
    } catch (error) {
      notify('Failed to delete business profile', { type: 'error' });
      console.error('Delete error:', error);
    }
  };

  if (!record) {
    return null;
  }

  const canRetry = ![BizProfileState.QUEUED, BizProfileState.PROCESSING].includes(record.status);
  const canRetryFromFailed = record.status === BizProfileState.PROCESSING_FAILED;

  return (
    <div style={{ marginBottom: '20px' }}>
      {canRetry && (
        <Button onClick={handleRetry} variant="contained" color="primary" sx={{ marginRight: '10px' }}>
          Restart Processing
        </Button>
      )}
      {canRetryFromFailed && (
        <Button onClick={handleRetryFromFailed} variant="contained" color="primary" sx={{ marginRight: '10px' }}>
          Retry From Failed
        </Button>
      )}
      <Button onClick={handleDelete} variant="contained" color="error" sx={{ marginRight: '10px' }}>
        Delete Profile
      </Button>
    </div>
  );
};

export const BizProfileShow = () => {
  return (
    <Show>
      <SimpleShowLayout>
        <TextField source="id" />
        <TextField source="name" />
        <TextField source="bizOrganizationName" label="Organization Name" />
        <TextField source="jobTitle" />
        <TextField source="status" />
        <TextField source="statusReason" label="Status Reason" />
        <DateField source="createdAt" />
        <DateField source="updatedAt" />
        <ActionButtons />
      </SimpleShowLayout>
    </Show>
  );
};
