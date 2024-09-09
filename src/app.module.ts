import { Module } from '@nestjs/common';
import { ProxyController } from './proxy/controller/proxy.controller';
// import { ProxyService } from './proxy/service/proxy.service';
import { ProxyService } from './proxy/service/test.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
  ],
  controllers: [ProxyController],
  providers: [ProxyService],
})  
export class AppModule {}