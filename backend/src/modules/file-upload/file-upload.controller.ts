import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { FileUploadService } from './file-upload.service';
import { MimeTypeValidator } from './validators/mime-type.validator';

const FILE_BODY_SCHEMA = {
  schema: {
    type: 'object' as const,
    properties: { file: { type: 'string' as const, format: 'binary' } },
  },
};

const MAX_SIZE = 5 * 1024 * 1024;
const CSV_JSON_MIME = /(csv|vnd\.ms-excel|json)/;
const CSV_MIME = /(csv|vnd\.ms-excel)/;
const JSON_MIME = /json/;

@ApiTags('file-upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: undefined }))
  @ApiOperation({ summary: 'Upload CSV or JSON file with subnet data' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_BODY_SCHEMA)
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_SIZE }),
          new MimeTypeValidator({ mimePattern: CSV_JSON_MIME }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    return this.fileUploadService.processFile(file, user.id);
  }

  @Post('csv')
  @UseInterceptors(FileInterceptor('file', { storage: undefined }))
  @ApiOperation({ summary: 'Upload CSV file with subnet data' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_BODY_SCHEMA)
  async uploadCsv(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_SIZE }),
          new MimeTypeValidator({ mimePattern: CSV_MIME }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    return this.fileUploadService.processFile(file, user.id);
  }

  @Post('json')
  @UseInterceptors(FileInterceptor('file', { storage: undefined }))
  @ApiOperation({ summary: 'Upload JSON file with subnet data' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_BODY_SCHEMA)
  async uploadJson(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_SIZE }),
          new MimeTypeValidator({ mimePattern: JSON_MIME }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    return this.fileUploadService.processFile(file, user.id);
  }
}
