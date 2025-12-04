## Websocket Examples

This is a playground for testing and experimenting with different websocket implementations.

### Getting Started

Add to AppModule

```typescript
@Module({
  imports: [
    WebsocketModule.forRoot(),
    WebsocketExampleModule,
  ]
})
export class AppModule {}
```
