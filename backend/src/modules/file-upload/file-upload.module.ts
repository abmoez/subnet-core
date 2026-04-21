import { Module } from '@nestjs/common';
import { FileUploadController } from './file-upload.controller';
import { FileUploadService } from './file-upload.service';
import { ParserFactory } from './factories/parser.factory';
import { CsvParserStrategy } from './strategies/csv-parser.strategy';
import { JsonParserStrategy } from './strategies/json-parser.strategy';
import { SubnetsModule } from '../subnets/subnets.module';
import { IpsModule } from '../ips/ips.module';

@Module({
  imports: [SubnetsModule, IpsModule],
  controllers: [FileUploadController],
  providers: [FileUploadService, ParserFactory, CsvParserStrategy, JsonParserStrategy],
})
export class FileUploadModule {}
