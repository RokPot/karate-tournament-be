import type { IErrorResponse } from '~common/exceptions';

export interface IValidationExceptionField {
  /**
   * Camel cased constraint name
   */
  type: string;
  /**
   * Human-readable message
   */
  message: string;
}

export interface IValidationExceptionResponse extends IErrorResponse {
  /**
   * Array of validation errors, keyed by dot-separated path
   * @type {[path: string]: IValidationExceptionField[]}
   *
   * @example
   *  {
   *     "pistachio.0.purple": [
   *       {
   *         type: "isString",
   *         message: "purple must be a string"
   *       }
   *     ]
   *   }
   */
  errors: Record<string, IValidationExceptionField[]>;
}
