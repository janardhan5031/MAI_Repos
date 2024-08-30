import { Module, CacheModule  } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlogModule } from './modules/blog/blog.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from "path";
import { ConfigurationModule } from './common/config/config.module';
import { ConfigService } from '@nestjs/config';
import { ConfigurationService } from './common/config/config.service';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggingModule } from './common/logging/logging.module';
import { CachingModule } from './common/caching/caching.module';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      debug: false,
      playground: true,
      autoSchemaFile: join(process.cwd(), "src/schema.gql"),
      sortSchema: true,
    }),
    BlogModule,
    MongooseModule.forRootAsync({
      imports: [ConfigurationModule],
      useFactory: async (config: ConfigurationService) => {
        return {
          uri: config.get('DATABASE_CONNECTION'),
          useNewUrlParser: true,
          useUnifiedTopology: true,
      }
    },
      inject: [ConfigurationService]
    }),
    CachingModule,
    ConfigurationModule,
    LoggingModule,
    CachingModule],
  controllers: [AppController],
  providers: [AppService, ConfigurationService, ConfigService],
})
export class AppModule {}
