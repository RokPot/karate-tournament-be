import { Card, CardContent, Box, Button, Container, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Form, required, useTranslate, useLogin, email, useNotify, useSafeSetState } from 'ra-core';
import { FC } from 'react';
import { TextInput } from 'react-admin';
import { FieldValues } from 'react-hook-form';

const AuthnLogin = () => {
  return (
    <Container component="main" maxWidth="xs">
      <StyledCard>
        <CardContent>
          <StyledBox>
            <img
              src={import.meta.env.BASE_URL + '/orion-black.svg'}
              width="80px"
              height="80px"
              alt="logo"
              style={{ marginBottom: '1em', marginTop: '1em' }}
            />
          </StyledBox>
          <LoginForm />
        </CardContent>
      </StyledCard>
    </Container>
  );
};

export default AuthnLogin;

interface LoginFormProps {
  redirectTo?: string;
  className?: string;
}

const LoginForm: FC<LoginFormProps> = (props) => {
  const { redirectTo, className } = props;
  const [loading, setLoading] = useSafeSetState(false);
  const login = useLogin();
  const translate = useTranslate();
  const notify = useNotify();

  const submit = (values: FieldValues) => {
    setLoading(true);
    login(values, redirectTo)
      .then(() => {
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        notify(
          typeof error === 'string'
            ? error
            : typeof error === 'undefined' || !error.message
              ? 'ra.auth.sign_in_error'
              : error.message,
          {
            type: 'error',
            messageArgs: {
              _: typeof error === 'string' ? error : error && error.message ? error.message : undefined,
            },
          },
        );
      });
  };

  return (
    <Form onSubmit={submit} mode="onChange" noValidate className={className}>
      <StyledFormContent>
        <TextInput
          autoFocus
          source="email"
          label={translate('ra.auth.email')}
          autoComplete="email"
          validate={[required(), email()]}
          fullWidth
        />
        <TextInput
          source="password"
          label={translate('ra.auth.password')}
          type="password"
          autoComplete="current-password"
          validate={required()}
          fullWidth
        />

        <Box mt={2}>
          <Button variant="contained" type="submit" color="primary" disabled={loading} fullWidth>
            {loading ? <CircularProgress size={19} thickness={3} /> : translate('ra.auth.sign_in')}
          </Button>
        </Box>
      </StyledFormContent>
    </Form>
  );
};

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

const StyledFormContent = styled('div')({
  padding: '0 1em 1em 1em',
  '& .MuiTextField-root': {
    marginTop: '1em',
  },
});
