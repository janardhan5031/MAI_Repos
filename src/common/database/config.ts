
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigurationModule } from "../config/config.module";
import { ConfigurationService } from "../config/config.service";

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigurationModule],
      useFactory: async (config: ConfigurationService) => {
        return {
          uri: config.get("DATABASE_CONNECTION"),
          useNewUrlParser: true,
          useUnifiedTopology: true,
        };
      },
      inject: [ConfigurationService],
    }),
  ],
})
export class MongodbModule {}
