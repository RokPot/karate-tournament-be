/**
 * Interface for the error response
 *  - used to standardize error responses across mediums
 *  - should not contain medium specific information like http status message
 */
export interface IErrorResponse extends Record<string, any> {
  /**
   * Status of the response
   * - error: unrecoverable error
   */
  status: 'error';

  /**
   * Human-readable explanation of the error code
   */
  message: string;

  /**
   * Alphanumeric code of the error type
   */
  code: string;
}
