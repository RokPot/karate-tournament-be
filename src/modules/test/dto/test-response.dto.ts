import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class TestResponseDto {
  @Expose()
  @ApiProperty({
    description: 'Success message',
    example: 'Test endpoint called successfully',
  })
  message!: string;

  @Expose()
  @ApiProperty({
    description: 'Timestamp of the response',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp!: string;

  @Expose()
  @ApiProperty({
    description: 'Request data that was received',
    example: { name: 'John Doe', email: 'john.doe@example.com' },
  })
  data!: Record<string, any>;
}

export class TestGetResponseDto {
  @Expose()
  @ApiProperty({
    description: 'Success message',
    example: 'GET endpoint works!',
  })
  message!: string;

  @Expose()
  @ApiProperty({
    description: 'Current server time',
    example: '2024-01-01T00:00:00.000Z',
  })
  serverTime!: string;

  @Expose()
  @ApiProperty({
    description: 'Random number for testing',
    example: 42,
  })
  randomNumber!: number;
}

export class TestEchoResponseDto {
  @Expose()
  @ApiProperty({
    description: 'Echoed message',
    example: 'hello-world',
  })
  echo!: string;
}

export class TestQueryResponseDto {
  @Expose()
  @ApiProperty({
    description: 'Name parameter',
    example: 'John',
    required: false,
  })
  name?: string;

  @Expose()
  @ApiProperty({
    description: 'Age parameter',
    example: '25',
    required: false,
  })
  age?: string;
}

export class TestProtectedResponseDto {
  @Expose()
  @ApiProperty({
    description: 'Response message',
    example: 'This is a protected endpoint',
  })
  message!: string;

  @Expose()
  @ApiProperty({
    description: 'Additional note',
    example: 'You need to authenticate with Auth0 to access this endpoint',
  })
  note!: string;
}
