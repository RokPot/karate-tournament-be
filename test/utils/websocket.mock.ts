import { vi } from 'vitest';

import { WebsocketService } from '~common/websocket/websocket.service';

/**
 * Mock implementation of WebsocketService for testing
 */
export class WebsocketServiceMock implements Partial<WebsocketService> {
  publishMessage = vi.fn();

  private eventPromiseResolvers: Array<(value: unknown) => void> = [];
  private publishedEvents: unknown[] = [];

  /**
   * Wait for a specific number of events to be published
   * @param count Number of events to wait for
   * @param filter Optional callback to filter events
   */
  waitForEvents(count: number, filter?: (event: unknown) => boolean): Promise<unknown[]> {
    const timeout = 5000; // 5 seconds timeout
    const pollInterval = 100; // check every 100ms

    const eventsPromise = new Promise<unknown[]>((resolve) => {
      const getFilteredEvents = () => {
        const filteredEvents = filter ? this.publishedEvents.filter(filter) : this.publishedEvents;
        return filteredEvents;
      };

      // Check immediately first
      const filteredEvents = getFilteredEvents();
      if (filteredEvents.length >= count) {
        resolve(filteredEvents.slice(0, count));
        return;
      }

      // Set up polling interval
      const interval = setInterval(() => {
        const currentFilteredEvents = getFilteredEvents();
        if (currentFilteredEvents.length >= count) {
          clearInterval(interval);
          resolve(currentFilteredEvents.slice(0, count));
        }
      }, pollInterval);

      // Clear interval on timeout to prevent memory leaks
      setTimeout(() => clearInterval(interval), timeout);
    });

    const timeoutPromise = new Promise<unknown[]>((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout waiting for ${count} events after ${timeout}ms`)), timeout);
    });

    return Promise.race([eventsPromise, timeoutPromise]);
  }

  constructor() {
    this.publishMessage = vi.fn().mockImplementation((event: unknown) => {
      this.publishedEvents.push(event);
      this.eventPromiseResolvers.forEach((resolve) => resolve(event));
    });
  }

  /**
   * Clear all tracked events and resolvers
   */
  reset() {
    this.eventPromiseResolvers = [];
    this.publishedEvents = [];
  }
}

/**
 * Provider configuration for WebsocketServiceMock
 */
export const WebsocketServiceMockProvider = {
  provide: WebsocketService,
  useClass: WebsocketServiceMock,
};
