import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import KAFKA_TOPICS from "./kafka.config";
@Injectable()
export class ConfigurationService {
  private KAFKA_ENV: string;
  constructor(private configService: ConfigService) {
    this.KAFKA_ENV = this.configService.get("KAFKA_ENV");
  }
  get(configString: string) {
    return this.configService.getOrThrow(configString);
  }

  getKafkaTopic(topicName: string): string {
    return `${KAFKA_TOPICS[topicName]}.${this.KAFKA_ENV}`;
  }

  getKafkaGroupId() {
    return `${this.KAFKA_ENV}`;
  }
}

export { ConfigService };
