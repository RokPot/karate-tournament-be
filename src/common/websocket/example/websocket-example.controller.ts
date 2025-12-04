import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { SendMessageDto } from './dtos/send-message.dto';
import { WebsocketExampleService } from './websocket-example.service';

@ApiTags('Websocket Examples')
@Controller('websocket-examples')
export class WebsocketExampleController {
  constructor(private readonly websocketExampleService: WebsocketExampleService) {}

  /**
   * Send a message that will be broadcasted via websocket
   */
  @Post('send-message')
  async sendMessage(@Body() body: SendMessageDto): Promise<void> {
    await this.websocketExampleService.broadcastMessage(body.userId, body.message);
  }
}
