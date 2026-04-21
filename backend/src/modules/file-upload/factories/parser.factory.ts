import { Injectable, BadRequestException } from '@nestjs/common';
import { FileParserStrategy } from '../strategies/parser.interface';
import { CsvParserStrategy } from '../strategies/csv-parser.strategy';
import { JsonParserStrategy } from '../strategies/json-parser.strategy';

@Injectable()
export class ParserFactory {
  private readonly strategies: FileParserStrategy[];

  constructor(csvParser: CsvParserStrategy, jsonParser: JsonParserStrategy) {
    this.strategies = [csvParser, jsonParser];
  }

  getParser(mimetype: string): FileParserStrategy {
    const strategy = this.strategies.find((s) => s.supports(mimetype));
    if (!strategy) {
      throw new BadRequestException(
        `Unsupported file format: ${mimetype}. Supported formats: CSV, JSON.`,
      );
    }
    return strategy;
  }
}
