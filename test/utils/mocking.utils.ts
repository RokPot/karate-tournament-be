import { type Mock } from 'node:test';

import { type ValueProvider } from '@nestjs/common/interfaces/modules/provider.interface';

/**
 * Utility to create a strongly-typed mock for a given class/interface.
 *
 * @typeParam T - The base class or interface to mock.
 */
export type MockedClass<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? Mock<(...args: Parameters<T[K]>) => ReturnType<T[K]>> : T[K];
};

export type ProviderMock<T> = ValueProvider<MockedClass<T>>;
