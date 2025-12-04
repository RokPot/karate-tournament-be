export const MESSAGE_SENT_EVENT_TYPE = 'message-sent';

export class MessageSentEvent {
  type = MESSAGE_SENT_EVENT_TYPE;
  payload: {
    userId: string;
    message: string;
    success: boolean;
    error: string | null;
  };

  constructor(userId: string, message: string, success: boolean = true, error: string | null = null) {
    this.payload = {
      userId,
      message,
      success,
      error,
    };
  }
}

export class MessageSentSuccessEvent extends MessageSentEvent {
  constructor(userId: string, message: string) {
    super(userId, message);
  }
}

export class MessageSentErrorEvent extends MessageSentEvent {
  constructor(userId: string, error: string | null = null) {
    super(userId, '', false, error);
  }
}
