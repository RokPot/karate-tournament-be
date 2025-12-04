import { type ValidationError } from '@nestjs/common';

import { ValidationException } from '~common/exceptions';
import { type IValidationExceptionResponse } from '~common/exceptions/interfaces/validation-exception-response.interface';
import { type SocketEvent } from '~common/websocket/events/socket.event';

export const VALIDATION_ERRORS_WEBSOCKET_EVENT_TYPE = 'validation-errors';

export class ValidationErrorsWebsocketEvent implements SocketEvent {
  type = VALIDATION_ERRORS_WEBSOCKET_EVENT_TYPE;
  payload: {
    userId: string;
    errors: IValidationExceptionResponse['errors'];
    eventType: string;
  };

  constructor(userId: string, errors: ValidationError[], eventType: string) {
    const errorsForPublic = ValidationException.fromValidationErrorArray(errors).toPublic().errors;

    this.payload = {
      userId,
      errors: errorsForPublic,
      eventType,
    };
  }
}
