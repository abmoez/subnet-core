import { Injectable, BadRequestException } from '@nestjs/common';
import { FileParserStrategy, ParsedSubnetGroup, ParsedIp } from './parser.interface';

const CIDR_REGEX = /^(\d{1,3}\.){3}\d{1,3}\/([0-9]|[1-2][0-9]|3[0-2])$/;
const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
const VALID_STATUSES = new Set(['active', 'reserved', 'deprecated']);

@Injectable()
export class JsonParserStrategy implements FileParserStrategy {
  supports(mimetype: string): boolean {
    return mimetype === 'application/json';
  }

  async parse(buffer: Buffer): Promise<ParsedSubnetGroup[]> {
    let data: unknown;

    try {
      data = JSON.parse(buffer.toString('utf-8'));
    } catch {
      throw new BadRequestException('Invalid JSON file format');
    }

    if (!Array.isArray(data)) {
      throw new BadRequestException('JSON must be an array of subnet objects');
    }

    if (data.length === 0) {
      throw new BadRequestException('JSON array is empty');
    }

    const groups: ParsedSubnetGroup[] = [];

    for (let i = 0; i < data.length; i++) {
      const entry = data[i];
      const idx = i + 1;

      if (typeof entry !== 'object' || entry === null) {
        throw new BadRequestException(`Entry ${idx}: must be an object`);
      }

      const cidr = entry.cidr?.toString().trim();
      if (!cidr) {
        throw new BadRequestException(`Entry ${idx}: missing "cidr" field`);
      }
      if (!CIDR_REGEX.test(cidr)) {
        throw new BadRequestException(`Entry ${idx}: invalid CIDR notation "${cidr}"`);
      }

      const name = entry.name?.toString().trim();
      if (!name) {
        throw new BadRequestException(`Entry ${idx}: missing "name" field`);
      }

      const group: ParsedSubnetGroup = {
        cidr,
        name,
        description: entry.description?.toString().trim() || undefined,
        ips: [],
      };

      if (entry.ips) {
        if (!Array.isArray(entry.ips)) {
          throw new BadRequestException(`Entry ${idx}: "ips" must be an array`);
        }

        for (let j = 0; j < entry.ips.length; j++) {
          const ipEntry = entry.ips[j];
          const ipIdx = j + 1;

          if (typeof ipEntry !== 'object' || ipEntry === null) {
            throw new BadRequestException(`Entry ${idx}, IP ${ipIdx}: must be an object`);
          }

          const address = ipEntry.address?.toString().trim();
          if (!address) {
            throw new BadRequestException(`Entry ${idx}, IP ${ipIdx}: missing "address" field`);
          }
          if (!IPV4_REGEX.test(address)) {
            throw new BadRequestException(
              `Entry ${idx}, IP ${ipIdx}: invalid IP address "${address}"`,
            );
          }

          const ipName = ipEntry.name?.toString().trim();
          if (!ipName) {
            throw new BadRequestException(`Entry ${idx}, IP ${ipIdx}: missing "name" field`);
          }

          const ip: ParsedIp = { address, name: ipName };

          const ipDesc = ipEntry.description?.toString().trim();
          if (ipDesc) ip.description = ipDesc;

          const ipStatus = ipEntry.status?.toString().trim().toLowerCase();
          if (ipStatus) {
            if (!VALID_STATUSES.has(ipStatus)) {
              throw new BadRequestException(
                `Entry ${idx}, IP ${ipIdx}: invalid status "${ipStatus}". Must be: active, reserved, or deprecated`,
              );
            }
            ip.status = ipStatus;
          }

          group.ips.push(ip);
        }
      }

      groups.push(group);
    }

    return groups;
  }
}
