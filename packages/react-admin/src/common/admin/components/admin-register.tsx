import { Card, CardContent, Box, TextField, Button, Typography, Container } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNotify, useTranslate } from 'ra-core';
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AuthnContext, AuthnRest } from '~common/authn/authn.helpers';
import { IAuthnToken } from '~common/authn/authn.types';
import { RestError } from '~common/http';

import { AdminContext } from '../admin.helpers';
import { IAdminAccount } from '../admin.types';

const AdminRegister = () => {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const translate = useTranslate();
  const navigate = useNavigate();
  const notify = useNotify();

  const { authnRegister, authnLogin, setAuthnToken } = useContext(AuthnContext);
  const { adminAccount, setAdminAccount } = useContext(AdminContext);

  if (adminAccount) {
    // already logged in
    notify('Already logged in');
    navigate('/');
    return;
  }

  const token = new URLSearchParams(window.location.hash.split('?')[1]).get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(translate('ra.auth.error.passwords_do_not_match'));
      return;
    }

    let tokens: IAuthnToken | undefined;
    let error: RestError | any;
    try {
      tokens = await authnRegister({ email, password });
    } catch (e: any) {
      error = e;
    }

    if (error instanceof RestError && error.code === 'local-authn-identity-exists') {
      // try to log in
      try {
        tokens = await authnLogin({ email, password });
      } catch (e: any) {
        error = e;
      }
    }

    if (tokens) {
      // try to register
      try {
        const { data: accountDetails } = await AuthnRest.post<IAdminAccount>('/admin/account/register', {
          body: { name, email, token },
          accessToken: tokens.accessToken,
        });
        if (accountDetails) {
          // success
          setAuthnToken(tokens);
          setAdminAccount(accountDetails);
          navigate('/');
          return;
        }
      } catch (e: any) {
        error = e;
      }
    }

    if (error instanceof RestError && error.errors) {
      const aw = Object.values(error.errors)
        .map((e: any) => e.map((ee: { message: string }) => ee.message))
        .join(', ');
      setError(aw);
    } else if (error) {
      setError('message' in error ? error.message : 'Unknown error');
    } else {
      setError('Unknown error');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <StyledCard>
        <CardContent>
          <StyledBox>
            <img
              src="/orion-black.svg"
              width="80px"
              height="80px"
              alt="logo"
              style={{ marginBottom: '1em', marginTop: '1em' }}
            />
          </StyledBox>
          {!token && (
            <Typography variant="h5" align="center">
              {translate('ra.auth.register_token_needed')}
            </Typography>
          )}
          {token && (
            <Form onSubmit={handleSubmit}>
              {error && (
                <Typography color="error" align="center">
                  {error}
                </Typography>
              )}
              <Input
                id="name"
                label={translate('ra.auth.name')}
                type="name"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                id="email"
                label={translate('ra.auth.email')}
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                id="password"
                label={translate('ra.auth.password')}
                type="password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                id="confirm-password"
                label={translate('ra.auth.confirm_password')}
                type="password"
                fullWidth
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Box mt={2}>
                <Button type="submit" fullWidth variant="contained" color="primary">
                  {translate('ra.auth.register')}
                </Button>
              </Box>
              <Box mt={2} textAlign="center">
                <Typography variant="body2">
                  {translate('ra.auth.already_have_account')} <Link to="/login">{translate('ra.auth.sign_in')}</Link>
                </Typography>
              </Box>
            </Form>
          )}
        </CardContent>
      </StyledCard>
    </Container>
  );
};

export default AdminRegister;

const StyledCard = styled(Card)(() => ({
  minWidth: 300,
  marginTop: '6em',
}));

const StyledBox = styled(Box)({
  padding: '1em',
  display: 'flex',
  justifyContent: 'center',
  flexDirection: 'column',
  alignItems: 'center',
});

const Form = styled('form')({
  padding: '0 1em 1em 1em',
});

const Input = styled(TextField)({
  marginTop: '1em',
});
