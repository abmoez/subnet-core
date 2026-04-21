import { FileValidator } from '@nestjs/common';

export class MimeTypeValidator extends FileValidator<{ mimePattern: RegExp }> {
  buildErrorMessage(): string {
    return `File type not allowed. Accepted types: CSV, JSON`;
  }

  isValid(file?: Express.Multer.File): boolean {
    if (!file) return false;
    return this.validationOptions.mimePattern.test(file.mimetype);
  }
}
