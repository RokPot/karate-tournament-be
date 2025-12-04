import { Button } from '@mui/material';
import { useContext } from 'react';
import { useNotify } from 'react-admin';

import { AuthnContext } from '~common/authn/authn.helpers';
import { config } from '~common/config';
import { RestClient } from '~common/http';

export const PersonaPage = () => {
  const notify = useNotify();
  const { authnToken } = useContext(AuthnContext);
  const httpClient = new RestClient(config.apiBaseUrl, () => ({
    Authorization: `Bearer ${authnToken.accessToken}`,
  }));

  const deleteAllPersonas = async () => {
    try {
      await httpClient.delete('/admin/persona/all', {});
      notify('Done');
    } catch (error) {
      console.error('Failed to delete all personas:', error);
      notify('Failed to delete all personas', { type: 'error' });
    }
  };

  const seedPersonas = async () => {
    try {
      await httpClient.post('/admin/persona/seed', {});
      notify('Done');
    } catch (error) {
      console.error('Failed to seed personas:', error);
      notify('Failed to seed personas', { type: 'error' });
    }
  };

  return (
    <div>
      <h1>Persona</h1>
      <div style={{ display: 'flex', gap: '10px', flexDirection: 'row' }}>
        <Button variant="contained" color="error" onClick={deleteAllPersonas}>
          Delete all personas
        </Button>

        <Button variant="contained" color="success" onClick={seedPersonas}>
          Seed personas
        </Button>
      </div>
    </div>
  );
};
