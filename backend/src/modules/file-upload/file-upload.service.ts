import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ParserFactory } from './factories/parser.factory';
import { SubnetsService } from '../subnets/subnets.service';
import { IpsService } from '../ips/ips.service';
import { ParsedSubnetGroup } from './strategies/parser.interface';

export interface UploadResult {
  subnets: { total: number; created: number; failed: number };
  ips: { total: number; created: number; failed: number };
  errors: Array<{ row: string; error: string }>;
}

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);

  constructor(
    private readonly parserFactory: ParserFactory,
    private readonly subnetsService: SubnetsService,
    private readonly ipsService: IpsService,
  ) {}

  async processFile(file: Express.Multer.File, userId: string): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const parser = this.parserFactory.getParser(file.mimetype);
    const groups: ParsedSubnetGroup[] = await parser.parse(file.buffer);

    const result: UploadResult = {
      subnets: { total: groups.length, created: 0, failed: 0 },
      ips: { total: 0, created: 0, failed: 0 },
      errors: [],
    };

    for (const group of groups) {
      result.ips.total += group.ips.length;

      let subnet;
      try {
        subnet = await this.subnetsService.create(
          { cidr: group.cidr, name: group.name, description: group.description },
          userId,
        );
        result.subnets.created++;
      } catch (error) {
        result.subnets.failed++;
        result.errors.push({
          row: group.cidr,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        this.logger.warn(`Failed to create subnet ${group.cidr}: ${error}`);
        continue;
      }

      for (const ipData of group.ips) {
        try {
          await this.ipsService.create(
            subnet.id,
            {
              address: ipData.address,
              name: ipData.name,
              description: ipData.description,
              status: ipData.status,
            },
            userId,
          );
          result.ips.created++;
        } catch (error) {
          result.ips.failed++;
          result.errors.push({
            row: `${group.cidr} → ${ipData.address}`,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          this.logger.warn(`Failed to create IP ${ipData.address} in ${group.cidr}: ${error}`);
        }
      }
    }

    return result;
  }
}
