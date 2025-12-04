import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  TextField as MuiTextField,
  Typography,
} from '@mui/material';
import { useContext, useState, useEffect } from 'react';
import { Button, Show, SimpleShowLayout, TextField, useNotify, useShowController } from 'react-admin';

import { AuthnContext } from '~common/authn/authn.helpers';
import { config } from '~common/config';
import { RestClient } from '~common/http';

import ImpersonateUserButton from './ImpersonateUserButton';

const ResetPersonaButton = ({ userId }: { userId: string; userEmail: string }) => {
  const notify = useNotify();
  const { authnToken } = useContext(AuthnContext);

  const handleClick = async () => {
    try {
      const httpClient = new RestClient(config.apiBaseUrl, () => ({
        Authorization: `Bearer ${authnToken?.accessToken}`,
      }));

      await httpClient.post(`/admin/persona/${userId}/reset`, {});

      notify('Persona reset to initial state successfully', { type: 'success' });
    } catch (error) {
      console.error('Reset persona error:', error);
      notify(error instanceof Error ? error.message : 'Reset failed', { type: 'error' });
    }
  };

  return (
    <Button
      label="Reset"
      onClick={handleClick}
      variant="contained"
      color="primary"
      sx={{
        margin: '5px',
        marginBottom: '10px',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        backgroundColor: '#90caf9',
        color: 'black',
        '&:hover': {
          backgroundColor: '#64b5f6',
        },
      }}
    />
  );
};

export const UserShow = () => {
  const { record } = useShowController();
  const [identities, setIdentities] = useState<any>(null);
  const { authnToken } = useContext(AuthnContext);
  const notify = useNotify();
  const [isAddLocalIdentityModalOpen, setisAddLocalIdentityModalOpen] = useState(false);
  const [password, setPassword] = useState('');

  const fetchIdentities = async () => {
    if (record && record.id && authnToken) {
      const httpClient = new RestClient(config.apiBaseUrl, () => ({
        Authorization: `Bearer ${authnToken.accessToken}`,
      }));

      try {
        const response = await httpClient.get(`/admin/user/${record.id}/identities/`);
        setIdentities(response.data.items);
      } catch (error) {
        console.error('Failed to fetch identities:', error);
        notify('Failed to fetch identities', { type: 'error' });
        setIdentities(null);
      }
    } else {
      setIdentities(null);
    }
  };

  useEffect(() => {
    fetchIdentities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record, authnToken]);

  if (!record) {
    return null;
  }

  const handleClickOpen = () => {
    setisAddLocalIdentityModalOpen(true);
  };

  const handleLocalIdentityModalClose = () => {
    setisAddLocalIdentityModalOpen(false);
    setPassword('');
  };

  const handleSubmit = async () => {
    if (!password || password.length < 8) {
      notify('Password must be at least 8 characters long', { type: 'warning' });
      return;
    }
    if (!record || !authnToken) {
      notify('User data or authentication token is missing', { type: 'error' });
      return;
    }

    const httpClient = new RestClient(config.apiBaseUrl, () => ({
      Authorization: `Bearer ${authnToken.accessToken}`,
    }));

    try {
      const response = await httpClient.post(`/admin/user/${record.id}/identities/local`, {
        body: { password },
      });
      console.log('response from adding local identity', response);
      notify('Local identity added successfully', { type: 'success' });
      fetchIdentities();
      handleLocalIdentityModalClose();
    } catch (error) {
      console.error('Failed to add local identity:', error);
      notify(error instanceof Error ? error.message : 'Failed to add local identity', { type: 'error' });
    }
  };

  const handleDeleteLocalIdentity = async () => {
    if (!confirm('Are you sure you want to delete this local identity?')) {
      return;
    }

    const httpClient = new RestClient(config.apiBaseUrl, () => ({
      Authorization: `Bearer ${authnToken.accessToken}`,
    }));

    try {
      const response = await httpClient.delete(`/admin/user/${record.id}/identities/local`, {});
      console.log('response from deleting local identity', response);
      notify('Local identity deleted successfully', { type: 'success' });
      fetchIdentities();
    } catch (error) {
      console.error('Failed to delete local identity:', error);
      notify(error instanceof Error ? error.message : 'Failed to delete local identity', { type: 'error' });
    }
  };

  return (
    <Show>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px' }}>
        <Box>
          <Typography variant="h6">User Details</Typography>
          <SimpleShowLayout>
            <TextField source="name" />
            <TextField source="email" />
            <TextField source="createdAt" />
            <TextField source="updatedAt" />
            <TextField source="roles" />
          </SimpleShowLayout>
        </Box>

        <Divider />
        <Box>
          <Typography variant="h6">Auth Identities</Typography>
          <div>
            {identities ? (
              <ul>
                {identities.map((identity: any) => (
                  <li key={identity.id}>
                    <span>{identity.provider}: </span>
                    <span>{identity.providerId}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span>No auth identities</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px', flexDirection: 'row' }}>
            {record &&
              identities &&
              identities.filter((identity: any) => identity.provider === 'local').length === 0 && (
                <Button label="Add Local Identity" onClick={handleClickOpen} />
              )}
            {record && identities && identities.filter((identity: any) => identity.provider === 'local').length > 0 && (
              <Button label="Delete Local Identity" onClick={handleDeleteLocalIdentity} />
            )}
          </div>
        </Box>

        <Divider />
        <Box>
          <Typography variant="h6">Impersonate User</Typography>
          <div>
            {identities && identities.filter((identity: any) => identity.provider === 'clerk').length > 0 ? (
              <ImpersonateUserButton userId={record.id} />
            ) : (
              <span>No clerk identity</span>
            )}
          </div>
        </Box>

        {record.email.indexOf('@personas-testing.lossdog.com') > -1 && (
          <SimpleShowLayout style={{ backgroundColor: '#353434', padding: '10px' }}>
            <div>
              <b>Persona</b>
            </div>
            <div>This user is a Persona (not a real user)</div>
            <ResetPersonaButton userId={record.id} userEmail={record.email} />
          </SimpleShowLayout>
        )}
      </div>

      <Dialog open={isAddLocalIdentityModalOpen} onClose={handleLocalIdentityModalClose}>
        <DialogTitle>Add Local Identity</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter a password for the new local identity for user: {record?.email}
          </DialogContentText>
          <MuiTextField
            autoFocus
            margin="dense"
            id="password"
            label="Password"
            type="password"
            fullWidth
            variant="standard"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLocalIdentityModalClose} label="Cancel" />
          <Button onClick={handleSubmit} label="Submit" color="primary" />
        </DialogActions>
      </Dialog>
    </Show>
  );
};
