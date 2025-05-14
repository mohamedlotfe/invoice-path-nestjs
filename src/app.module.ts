/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PathModule } from './path/path.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PathModule, //PathModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
