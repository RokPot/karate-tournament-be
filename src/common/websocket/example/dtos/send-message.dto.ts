import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class SendMessageDto {
  @Expose()
  @IsString()
  readonly userId!: string;

  @Expose()
  @IsString()
  readonly message!: string;
}
