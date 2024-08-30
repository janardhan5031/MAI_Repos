import { CacheModule, Global, Module } from "@nestjs/common";
import { ConfigurationModule } from "../config/config.module";
import { ConfigurationService } from "../config/config.service";
import * as redisStore from "cache-manager-redis-store";
@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigurationModule],
      useFactory: async (config: ConfigurationService) => ({
        store: redisStore,
        host: config.get("REDIS_CACHE_HOST"),
        port: config.get("REDIS_CACHE_PORT"),
        auth_pass: config.get("REDIS_CACHE_AUTHENTICATION"),
      }),
      inject: [ConfigurationService],
    }),
  ],
  exports: [CacheModule],
})
export class CachingModule {}
