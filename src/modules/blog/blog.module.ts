import { Module } from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogResolver } from './blog.resolver';
//import { Blog, BlogSchema } from './blog.schema';
import { Blog, BlogSchema} from './entities/blog.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggingService } from 'src/common/logging/logging.service';
import { ConfigurationModule } from 'src/common/config/config.module';
import { LoggingModule } from 'src/common/logging/logging.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: Blog.name, schema: BlogSchema}
    ]),
    LoggingModule
  ],
  providers: [BlogResolver, BlogService]
})
export class BlogModule {}
