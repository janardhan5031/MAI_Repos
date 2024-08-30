import { CACHE_MANAGER, Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigurationService } from './common/config/config.service';
import {Cache} from 'cache-manager';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService,
    private readonly configService: ConfigurationService,
     @Inject(CACHE_MANAGER)private cacheModule: Cache) {}

  @Get()
  async getHello(): Promise<any> {
    let cacheValue = await this.cacheModule.get('HELLO_WORLD')
    const MESSAGE="HELLO FROM THE OTHER SIDE";
    if(cacheValue){
      return cacheValue;
    }
    await this.cacheModule.set('HELLO_WORLD', {from:'redis-cache',value: MESSAGE},{ttl:this.configService.get('REDIS_CACHE_TTL')});
    return {from:'redis-cache',value: MESSAGE}
  }
}
