import { Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { it, describe, beforeEach } from 'vitest';

import { BaseLoggerConfig } from './base-logger.config';
import { BaseLoggerService, IBaseLog } from './base-logger.service';

class TestLoggerService extends BaseLoggerService<BaseLoggerConfig, IBaseLog> {
  _process(instance: IBaseLog) {
    return instance;
  }
}

@Injectable()
class TestClass {
  constructor(public readonly logger: TestLoggerService) {}
}

describe('BaseLoggerService', () => {
  let logger: TestLoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TestClass, TestLoggerService],
    }).compile();

    const testService = await module.resolve<TestClass>(TestClass);

    logger = testService.logger;
  });

  it('should support all log argument combinations', ({ expect }) => {
    const context = 'TestClass';
    const data = { some: 'data' };
    const level = 'log';
    const message = 'Test log';
    const messages = ['other', 'things'];

    expect(logger.log(message)).toEqual({ context, level, message });
    expect(logger.log(data)).toEqual({ context, level, data });
    expect(logger.log(message, 'c')).toEqual({ context: 'c', level, message });
    expect(logger.log(data, 'c')).toEqual({ context: 'c', level, data });
    expect(logger.log(message, data)).toEqual({ context, message, level, data });
    expect(logger.log(message, data, 'c')).toEqual({ context: 'c', level, message, data });
    expect(logger.log(message, ...messages, data, 'c')).toEqual({ context: 'c', level, message, data, messages });
    expect(logger.send({ message, data, type: 'metric' })).toEqual({ context, level, message, data, type: 'metric' });
  });

  it('should support all error log argument combinations', ({ expect }) => {
    const context = 'TestClass';
    const data = { some: 'data' };
    const level = 'error';
    const message = 'Test log';
    const messages = ['other', 'things'];
    const error = new Error();
    const stack = error.stack;

    expect(logger.error(stack)).toEqual({ context, level, stack });
    expect(logger.error(error)).toEqual({ context, level, error });
    expect(logger.error(stack, 'c')).toEqual({ context: 'c', level, stack });
    expect(logger.error(error, 'c')).toEqual({ context: 'c', level, error });
    expect(logger.error(message, stack)).toEqual({ context, message, level, stack });
    expect(logger.error(message, error)).toEqual({ context, message, level, error });
    expect(logger.error(message, error, 'c')).toEqual({ context: 'c', message, level, error });
    expect(logger.error(message, stack, 'c')).toEqual({ context: 'c', message, level, stack });
    expect(logger.error(message, data, error, 'c')).toEqual({ context: 'c', level, message, data, error });
    expect(logger.error(message, data, stack, 'c')).toEqual({ context: 'c', level, message, data, stack });
    expect(logger.error(message, data, stack)).toEqual({ context, level, message, data, stack });
    expect(logger.error(message, data, error)).toEqual({ context, level, message, data, error });
    expect(logger.error(message, ...messages, error, 'c')).toEqual({ context: 'c', level, message, messages, error });
    expect(logger.error(message, ...messages, stack, 'c')).toEqual({ context: 'c', level, message, messages, stack });
    expect(logger.error(message, ...messages, error, 'c')).toEqual({ context: 'c', level, message, messages, error });
    expect(logger.error(message, ...messages, data, error)).toEqual({ context, level, message, data, messages, error });
    expect(logger.error(message, ...messages, data, stack)).toEqual({ context, level, message, data, messages, stack });
  });
});
