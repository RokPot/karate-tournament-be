/**
 * Standard status response
 */
export interface IStatusResponse extends Record<string, any> {
  /**
   *  Status of the response
   */
  status: 'ok' | string;

  /**
   * Human-readable explanation of the status
   */
  message: string;

  /**
   * Alphanumeric code of the message type
   */
  code: string;
}
