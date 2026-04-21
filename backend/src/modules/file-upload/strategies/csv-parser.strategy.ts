import { Injectable, BadRequestException } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { FileParserStrategy, ParsedSubnetGroup, ParsedIp } from './parser.interface';

const CIDR_REGEX = /^(\d{1,3}\.){3}\d{1,3}\/([0-9]|[1-2][0-9]|3[0-2])$/;
const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
const VALID_STATUSES = new Set(['active', 'reserved', 'deprecated']);

@Injectable()
export class CsvParserStrategy implements FileParserStrategy {
  supports(mimetype: string): boolean {
    return mimetype === 'text/csv';
  }

  async parse(buffer: Buffer): Promise<ParsedSubnetGroup[]> {
    let records: Record<string, string>[];

    try {
      records = parse(buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch {
      throw new BadRequestException('Invalid CSV file format');
    }

    if (!records.length) {
      throw new BadRequestException('CSV file is empty');
    }

    if (!('cidr' in records[0])) {
      throw new BadRequestException('CSV must contain a "cidr" column');
    }

    const groupMap = new Map<string, ParsedSubnetGroup>();

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 1;

      const cidr = row.cidr?.trim();
      if (!cidr) {
        throw new BadRequestException(`Row ${rowNum}: missing CIDR value`);
      }
      if (!CIDR_REGEX.test(cidr)) {
        throw new BadRequestException(`Row ${rowNum}: invalid CIDR notation "${cidr}"`);
      }

      const subnetName = row.name?.trim();

      if (!groupMap.has(cidr)) {
        if (!subnetName) {
          throw new BadRequestException(
            `Row ${rowNum}: "name" is required for subnet ${cidr} (must appear on the first row for this CIDR)`,
          );
        }
        groupMap.set(cidr, {
          cidr,
          name: subnetName,
          description: row.description?.trim() || undefined,
          ips: [],
        });
      }

      const group = groupMap.get(cidr)!;

      if (subnetName && !group.description && row.description?.trim()) {
        group.description = row.description.trim();
      }

      const ipAddress = row.ip?.trim();
      if (ipAddress) {
        if (!IPV4_REGEX.test(ipAddress)) {
          throw new BadRequestException(`Row ${rowNum}: invalid IP address "${ipAddress}"`);
        }

        const ipName = row.ip_name?.trim();
        if (!ipName) {
          throw new BadRequestException(
            `Row ${rowNum}: "ip_name" is required when an IP address is provided`,
          );
        }

        const ipEntry: ParsedIp = { address: ipAddress, name: ipName };

        const ipDesc = row.ip_description?.trim();
        if (ipDesc) ipEntry.description = ipDesc;

        const ipStatus = row.ip_status?.trim()?.toLowerCase();
        if (ipStatus) {
          if (!VALID_STATUSES.has(ipStatus)) {
            throw new BadRequestException(
              `Row ${rowNum}: invalid IP status "${ipStatus}". Must be: active, reserved, or deprecated`,
            );
          }
          ipEntry.status = ipStatus;
        }

        group.ips.push(ipEntry);
      }
    }

    return Array.from(groupMap.values());
  }
}
