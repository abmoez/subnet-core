export interface ParsedIp {
  address: string;
  name: string;
  description?: string;
  status?: string;
}

export interface ParsedSubnetGroup {
  cidr: string;
  name: string;
  description?: string;
  ips: ParsedIp[];
}

export interface FileParserStrategy {
  parse(buffer: Buffer): Promise<ParsedSubnetGroup[]>;
  supports(mimetype: string): boolean;
}
