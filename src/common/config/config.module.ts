import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConfigurationService } from './config.service';
@Module({
    imports:[
        ConfigModule.forRoot({
            envFilePath: `src/common/config/development.env`
        })
    ],
    exports:[ConfigurationService],
    providers: [ConfigurationService, ConfigService]
})
export class ConfigurationModule {}
