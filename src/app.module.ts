import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { SentryModule } from '@sentry/nestjs/setup';

import { Auth0Module, Auth0Guard } from '~common/auth';
import { HttpHealthModule } from '~common/http/health';
import { LoggerModule } from '~common/logger';
import { MailModule } from '~common/mail';
import { SocketIOWebsocketPlugin } from '~common/websocket/providers/socketio/socketio.plugin';
import { WebsocketModule } from '~common/websocket/websocket.module';

import { DatabaseModule } from '~database';

import { CategoryModule } from '~modules/category/category.module';
import { ClubModule } from '~modules/club/club.module';
import { InvitationModule } from '~modules/invitation/invitation.module';
import { RegistrationModule } from '~modules/registration/registration.module';
import { ScheduleModule } from '~modules/schedule/schedule.module';
import { TestModule } from '~modules/test/test.module';
import { TournamentModule } from '~modules/tournament/tournament.module';
import { UserModule } from '~modules/user/user.module';

@Module({
  imports: [
    NestScheduleModule.forRoot(),
    SentryModule.forRoot(),
    HttpHealthModule,
    LoggerModule,
    MailModule,
    DatabaseModule,
    Auth0Module,

    WebsocketModule.forRoot([
      //
      SocketIOWebsocketPlugin,
    ]),

    // modules
    UserModule,
    ClubModule,
    InvitationModule,
    RegistrationModule,
    ScheduleModule,
    TournamentModule,
    CategoryModule,
    TestModule,
  ].filter((module) => module !== null),
  providers: [
    // Global Auth0 guard - all routes are protected by default
    // Use @Public() decorator to make routes public
    {
      provide: APP_GUARD,
      useClass: Auth0Guard,
    },
  ],
})
export class AppModule {}
