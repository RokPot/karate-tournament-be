import { Injectable, Module } from '@nestjs/common';
import {
  ContextIdFactory,
  DiscoveryModule,
  DiscoveryService,
  MetadataScanner,
  Reflector,
  ModuleRef,
} from '@nestjs/core';
import { Injector } from '@nestjs/core/injector/injector';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';

@Injectable()
export class MetadataService {
  constructor(
    private readonly reflector: Reflector,
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly moduleRef: ModuleRef,
  ) {}

  private readonly injector = new Injector();

  public *getAllMetadata<T>(
    symbol: string | symbol,
    options: {
      controller?: boolean;
      provider?: boolean;
    },
  ): IterableIterator<{ metadata: T[]; wrapper: any; instance: any; methodKey: string }> {
    let wrappers: InstanceWrapper[] = [];

    if (options.controller) {
      wrappers = wrappers.concat(
        this.discoveryService.getControllers().filter((wrapper) => wrapper.instance && !wrapper.isAlias),
      );
    }

    if (options.provider) {
      wrappers = wrappers.concat(
        this.discoveryService.getProviders().filter((wrapper) => wrapper.instance && !wrapper.isAlias),
      );
    }

    for (const wrapper of wrappers) {
      const { instance } = wrapper;
      for (const methodKey of this.metadataScanner.getAllMethodNames(instance)) {
        const target = instance[methodKey];
        // Circumvent a crash that comes from reflect-metadata if it is
        // given a non-object non-function target to reflect upon.
        if (!target || (typeof target !== 'function' && typeof target !== 'object')) {
          return null;
        }
        const metadata = this.reflector.get(symbol, target);
        if (metadata) {
          yield { metadata: Array.isArray(metadata) ? metadata : [metadata], wrapper, instance, methodKey };
        }
      }
    }
  }

  public *getAllHandlers<M, I extends any[], O>(
    symbol: string | symbol,
    options: {
      controller?: boolean;
      provider?: boolean;
    },
  ): IterableIterator<{
    metadata: M[];
    wrapper: any;
    methodKey: string;
    handler: (...args: I) => Promise<O>;
  }> {
    for (const { metadata, wrapper, methodKey } of this.getAllMetadata(symbol, options)) {
      yield {
        metadata: metadata as M[],
        wrapper,
        methodKey,
        handler: async (...data: any[]) => {
          let contextInstance = wrapper.instance;
          if (!wrapper.isDependencyTreeStatic()) {
            const contextId = ContextIdFactory.create();
            this.moduleRef.registerRequestByContextId(data, contextId);
            contextInstance = await this.injector.loadPerContext(
              wrapper.instance,
              wrapper.host,
              wrapper.host.providers,
              contextId,
            );
          }
          return await contextInstance[methodKey].call(contextInstance, ...data);
        },
      };
    }
  }
}

@Module({
  imports: [DiscoveryModule],
  providers: [MetadataService],
  exports: [MetadataService],
})
export class MetadataModule {}
