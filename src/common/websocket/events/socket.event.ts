export interface SocketEvent {
  type: string;
  payload: {
    userId: string;
    [key: string]: any;
  };
  channelName?: string;
}
