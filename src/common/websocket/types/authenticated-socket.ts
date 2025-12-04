import { type Socket } from 'socket.io';

import { type Auth0Payload } from '~common/auth';

export interface AuthenticatedSocket extends Socket {
  data: {
    auth: Auth0Payload;
  };
}
