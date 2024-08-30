/* eslint-disable prefer-const */
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
global["fetch"] = require("node-fetch");

async function bootstrap() {
  let RUNPORT = process.env.PORT ? process.env.PORT : 3000;
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  await app.listen(RUNPORT);
  console.log(
    `started at http://localhost:${
      process.env.PORT ? process.env.PORT : 3000
    }/graphql`
  );
}
bootstrap();
