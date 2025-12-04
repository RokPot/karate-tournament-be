import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

import { IStatusResponse } from '../interfaces/status-response.interface';

export class StatusResponseDto implements IStatusResponse {
  /**
   * Status
   */
  @Expose()
  @IsString()
  status!: 'ok' | string;

  /**
   * Message
   */
  @Expose()
  @IsString()
  message!: string;

  /**
   * Alphanumeric code of the message type
   */
  @Expose()
  @IsString()
  code!: string;

  constructor(data: IStatusResponse) {
    Object.assign(this, data);
  }

  public static fromDomain(domain: Partial<IStatusResponse>): StatusResponseDto {
    return new StatusResponseDto({ status: 'ok', message: 'Success', code: 'ok', ...domain });
  }
}
