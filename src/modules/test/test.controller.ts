import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

import { Public } from '~common/auth';

import { TestRequestDto } from './dto/test-request.dto';
import {
  TestResponseDto,
  TestGetResponseDto,
  TestEchoResponseDto,
  TestQueryResponseDto,
  TestProtectedResponseDto,
} from './dto/test-response.dto';

@ApiTags('Test')
@Controller('test')
export class TestController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Simple GET endpoint', description: 'A public endpoint that returns a simple response' })
  @ApiResponse({ status: 200, description: 'Successful response', type: TestGetResponseDto })
  public async getTest(): Promise<TestGetResponseDto> {
    const response = new TestGetResponseDto();
    response.message = 'GET endpoint works!';
    response.serverTime = new Date().toISOString();
    response.randomNumber = Math.floor(Math.random() * 100);
    return response;
  }

  @Public()
  @Get('echo/:message')
  @ApiOperation({
    summary: 'Echo endpoint with path parameter',
    description: 'Echoes back a message from the URL path',
  })
  @ApiParam({ name: 'message', description: 'Message to echo back', example: 'hello-world' })
  @ApiResponse({
    status: 200,
    description: 'Echoed message',
    type: TestEchoResponseDto,
  })
  public async echoPath(@Param('message') message: string): Promise<TestEchoResponseDto> {
    const response = new TestEchoResponseDto();
    response.echo = message;
    return response;
  }

  

  @Post()
  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: 'POST endpoint with body', description: 'Accepts a JSON body and returns it with metadata' })
  @ApiResponse({ status: 201, description: 'Successfully created', type: TestResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  public async postTest(@Body() body: TestRequestDto): Promise<TestResponseDto> {
    const response = new TestResponseDto();
    response.message = 'Test endpoint called successfully';
    response.timestamp = new Date().toISOString();
    response.data = body;
    return response;
  }

  
}
