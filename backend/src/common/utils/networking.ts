export interface ReservedIpEntry {
  address: string;
  name: string;
  description: string;
}

function ipToLong(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function longToIp(num: number): string {
  return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join('.');
}

export function getReservedIps(cidr: string): ReservedIpEntry[] {
  const [ipPart, prefixStr] = cidr.split('/');
  const prefixLength = parseInt(prefixStr, 10);

  if (prefixLength >= 31) {
    return [];
  }

  const mask = (~0 << (32 - prefixLength)) >>> 0;
  const networkLong = (ipToLong(ipPart) & mask) >>> 0;
  const broadcastLong = (networkLong | ~mask) >>> 0;

  const networkAddress = longToIp(networkLong);
  const gatewayAddress = longToIp(networkLong + 1);
  const broadcastAddress = longToIp(broadcastLong);

  return [
    {
      address: networkAddress,
      name: 'Network Address',
      description: `Auto-reserved network identifier for ${cidr}`,
    },
    {
      address: gatewayAddress,
      name: 'Default Gateway',
      description: `Auto-reserved default gateway for ${cidr}`,
    },
    {
      address: broadcastAddress,
      name: 'Broadcast Address',
      description: `Auto-reserved broadcast address for ${cidr}`,
    },
  ];
}
