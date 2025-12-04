import { useContext } from 'react';
import { Button, useNotify } from 'react-admin';

import { AuthnContext } from '~common/authn/authn.helpers';
import { impersonateUser } from '~common/authn/authn.impersonate';

const ImpersonateUserButton = ({ userId }: { userId: string }) => {
  const { authnToken } = useContext(AuthnContext);
  const notify = useNotify();

  const handleClick = async () => {
    await impersonateUser(userId, authnToken, (error) => {
      notify(error.message, { type: 'warning' });
    });
  };

  return <Button label="Impersonate" onClick={handleClick} />;
};

export default ImpersonateUserButton;
