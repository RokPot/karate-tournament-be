import { Button, Typography, Box, Alert } from '@mui/material';
import { useContext, useState } from 'react';
import { useNotify } from 'react-admin';

import { AuthnContext } from '~common/authn/authn.helpers';
import { config } from '~common/config';
import { RestClient } from '~common/http';

export const AdminActionsPage = () => {
  const notify = useNotify();
  const { authnToken } = useContext(AuthnContext);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  const httpClient = new RestClient(config.apiBaseUrl, () => ({
    Authorization: `Bearer ${authnToken.accessToken}`,
  }));

  const handleAction = async (actionKey: string, endpoint: string, successMessage: string) => {
    setLoading((prev) => ({ ...prev, [actionKey]: true }));
    try {
      const response = await httpClient.post(endpoint, {});
      const { affectedCount } = response.data;
      notify(`${successMessage}. Affected records: ${affectedCount}`, { type: 'success' });
    } catch (error) {
      console.error(`Failed to execute ${actionKey}:`, error);
      notify(`Failed to execute ${actionKey}`, { type: 'error' });
    } finally {
      setLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  const populateJobPositionFromTitle = async () => {
    await handleAction(
      'populateJobPosition',
      '/admin/biz/biz-profile/populate/job-position-from-title',
      'Successfully populated job positions from job titles',
    );
  };

  const populateCityStateFromLocation = async () => {
    await handleAction(
      'populateCityState',
      '/admin/biz/biz-profile/populate/city-state-from-location',
      'Successfully populated city and state from location',
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Actions
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        These operations cannot be undone.
      </Alert>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 600 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Biz Profile: Populate jobPosition from jobTitle
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            For every biz profile where jobPosition is blank, this will copy the value from jobTitle.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={populateJobPositionFromTitle}
            disabled={loading.populateJobPosition}
            sx={{ mt: 1 }}
          >
            {loading.populateJobPosition ? 'Processing...' : 'Populate Job Positions'}
          </Button>
        </Box>

        <Box>
          <Typography variant="h6" gutterBottom>
            Biz Profile: Populate city & state
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            For every biz profile where city and state are null but location is not null, this will parse the location
            field to populate city and state. If the split result has only one element and it's 2 characters long, it
            will be treated as a state.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={populateCityStateFromLocation}
            disabled={loading.populateCityState}
            sx={{ mt: 1 }}
          >
            {loading.populateCityState ? 'Processing...' : 'Populate City & State'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
