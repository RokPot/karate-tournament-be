import {
  CallHandler,
  ExecutionContext,
  INestApplication,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { isObject, validateSync } from 'class-validator';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { getConfig } from '~common/config';
import { InvalidResponseException } from '~common/exceptions/invalid-response.exception';
import { HttpConfig } from '~common/http/http.config';
import { LoggerService } from '~common/logger';
import { formatValidationErrors } from '~common/utils/format-validation-errors.util';
import { ValidationErrors } from '~common/validate';

interface PlainLiteralObject {
  [key: string]: any;
}

@Injectable()
export class ClassSerializerInterceptor implements NestInterceptor {
  validateResponse?: (instance: any) => void;

  private readonly httpConfig = getConfig(HttpConfig);
  private readonly logger = new LoggerService(ClassSerializerInterceptor.name);

  constructor() {
    switch (this.httpConfig.validateResponse) {
      case 'ignore':
        break;
      case 'throw':
        this.validateResponse = this.validateOrThrow;
        break;
      case 'warn':
      default:
        this.validateResponse = this.validateOrWarn;
        break;
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // get which controller is being called and on what handler
    // const handler = context.getHandler();
    // const controller = context.getClass();
    // console.log(`${controller.name}#${handler.name}`);

    return next.handle().pipe(map((res: PlainLiteralObject | Array<PlainLiteralObject>) => this.serialize(res)));
  }

  /**
   * Serializes responses that are non-null objects nor streamable files.
   */
  serialize(response: PlainLiteralObject | Array<PlainLiteralObject>): PlainLiteralObject | Array<PlainLiteralObject> {
    if (!isObject(response) || response instanceof StreamableFile) {
      return response;
    }
    if (Array.isArray(response)) {
      return response.map((item) => (item ? this.transformToPlain(item) : item));
    }
    return response ? this.transformToPlain(response) : response;
  }

  transformToPlain(plainOrClass: any): PlainLiteralObject {
    // Check if the object is a constructor-based object so we can use class-transformer' and 'class-validator' decorators.
    if (!(plainOrClass.constructor !== Object && plainOrClass instanceof plainOrClass.constructor)) {
      // If it's not a constructor-based object, we should throw an error by design to enforce the use of constructor-based objects.
      // This enables the use of 'class-transformer' and 'class-validator' decorators.
      throw new Error('Response is not a DTO', { cause: plainOrClass });
    }

    if (this.validateResponse) this.validateResponse(plainOrClass);

    return instanceToPlain(plainOrClass, {
      // Only include properties with `@Expose()` decorator set in plain object
      //  this is to prevent data leaking to the client
      // Unlike plainToInstance, we need to use excludeExtraneousValues to allow
      //  for plain object
      excludeExtraneousValues: true,
      // Use default values for properties that are not present in the data object
      //  (eg. `page: number = appConstants.pagination.page.default`)
      exposeDefaultValues: true,
      // Omit "undefined" plain properties if false
      exposeUnsetFields: false,
    });
  }

  private validateOptions = {
    // Remove non-decorated properties from the object
    whitelist: true,
    // We expect the internal object to be a superset of the response object
    forbidNonWhitelisted: false,
  };

  /**
   * Throw an exception with the validation issues
   */
  validateOrThrow(instance: any): void {
    const issues = validateSync(instance, this.validateOptions);
    if (issues?.length > 0) {
      throw new InvalidResponseException('Invalid server response', {
        cause: new ValidationErrors(issues),
      });
    }
  }

  /**
   * Log a warning with the validation issues
   */
  validateOrWarn(instance: any): void {
    const issues = validateSync(instance, this.validateOptions);
    if (issues?.length > 0) {
      this.logger.warn(formatValidationErrors(issues));
    }
  }
}

/**
 * Serialise all response DTOs
 *  - exclude all the properties without @Expose() decorator
 *  - validate the response against the class-validator decorators
 */
export function useClassSerializerInterceptor(app: INestApplication) {
  app.useGlobalInterceptors(new ClassSerializerInterceptor());
}
