import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../config/config.module';
import { LoggingService } from './logging.service';

@Module({
    imports: [ConfigurationModule], 
    providers: [LoggingService], 
    exports: [LoggingService]
})
export class LoggingModule {}
