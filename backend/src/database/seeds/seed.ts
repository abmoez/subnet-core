import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../modules/users/entities/user.entity';
import { Subnet } from '../../modules/subnets/entities/subnet.entity';
import { Ip } from '../../modules/ips/entities/ip.entity';
import { getReservedIps } from '../../common/utils/networking';

const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'password123';

const SAMPLE_DATA = [
  {
    subnet: { cidr: '192.168.1.0/24', name: 'Office Network', description: 'Main office subnet' },
    ips: [
      {
        address: '192.168.1.2',
        name: 'DNS Primary',
        description: 'Internal DNS resolver',
        status: 'active',
      },
      {
        address: '192.168.1.3',
        name: 'DNS Secondary',
        description: 'Backup DNS resolver',
        status: 'active',
      },
      {
        address: '192.168.1.10',
        name: 'Web Server',
        description: 'Primary web server (Nginx)',
        status: 'active',
      },
      {
        address: '192.168.1.11',
        name: 'Web Server 2',
        description: 'Secondary web server',
        status: 'reserved',
      },
      {
        address: '192.168.1.20',
        name: 'DB Primary',
        description: 'PostgreSQL primary',
        status: 'active',
      },
      {
        address: '192.168.1.21',
        name: 'DB Replica',
        description: 'PostgreSQL read replica',
        status: 'active',
      },
      {
        address: '192.168.1.30',
        name: 'Redis Cache',
        description: 'Redis cluster node',
        status: 'active',
      },
      {
        address: '192.168.1.40',
        name: 'Mail Server',
        description: 'SMTP relay',
        status: 'active',
      },
      {
        address: '192.168.1.50',
        name: 'Printer Floor 1',
        description: 'Office printer first floor',
        status: 'reserved',
      },
      {
        address: '192.168.1.51',
        name: 'Printer Floor 2',
        description: 'Office printer second floor',
        status: 'reserved',
      },
      {
        address: '192.168.1.60',
        name: 'NAS Storage',
        description: 'Synology NAS',
        status: 'active',
      },
      {
        address: '192.168.1.70',
        name: 'VPN Gateway',
        description: 'OpenVPN access server',
        status: 'active',
      },
      {
        address: '192.168.1.80',
        name: 'CCTV NVR',
        description: 'Network video recorder',
        status: 'active',
      },
      {
        address: '192.168.1.90',
        name: 'Legacy Server',
        description: 'Old file server — decommission planned',
        status: 'deprecated',
      },
      {
        address: '192.168.1.91',
        name: 'Old Print Spooler',
        description: 'Replaced by Floor 1 printer',
        status: 'deprecated',
      },
      {
        address: '192.168.1.100',
        name: 'Conference Room AP',
        description: 'Wi-Fi access point',
        status: 'active',
      },
      {
        address: '192.168.1.200',
        name: 'Guest DHCP Start',
        description: 'Reserved for guest DHCP range',
        status: 'reserved',
      },
      {
        address: '192.168.1.250',
        name: 'Guest DHCP End',
        description: 'End of guest DHCP range',
        status: 'reserved',
      },
    ],
  },
  {
    subnet: { cidr: '10.0.0.0/16', name: 'Development', description: 'Development environment' },
    ips: [
      {
        address: '10.0.0.2',
        name: 'Dev DNS',
        description: 'Internal dev DNS',
        status: 'active',
      },
      {
        address: '10.0.1.10',
        name: 'CI Runner 1',
        description: 'Jenkins CI primary',
        status: 'active',
      },
      {
        address: '10.0.1.11',
        name: 'CI Runner 2',
        description: 'Jenkins CI agent node',
        status: 'active',
      },
      {
        address: '10.0.1.12',
        name: 'CI Runner 3',
        description: 'Jenkins CI agent node (standby)',
        status: 'reserved',
      },
      {
        address: '10.0.1.20',
        name: 'Artifactory',
        description: 'Binary artifact repository',
        status: 'active',
      },
      {
        address: '10.0.2.5',
        name: 'Staging API',
        description: 'Staging REST API server',
        status: 'active',
      },
      {
        address: '10.0.2.6',
        name: 'Staging Worker',
        description: 'Background job processor',
        status: 'active',
      },
      {
        address: '10.0.2.10',
        name: 'Staging DB',
        description: 'Staging PostgreSQL instance',
        status: 'active',
      },
      {
        address: '10.0.2.20',
        name: 'Staging Redis',
        description: 'Staging cache layer',
        status: 'active',
      },
      {
        address: '10.0.3.1',
        name: 'QA API',
        description: 'QA environment API',
        status: 'active',
      },
      {
        address: '10.0.3.2',
        name: 'QA DB',
        description: 'QA database server',
        status: 'active',
      },
      {
        address: '10.0.3.10',
        name: 'Selenium Grid',
        description: 'Browser testing hub',
        status: 'reserved',
      },
      {
        address: '10.0.4.1',
        name: 'Monitoring',
        description: 'Prometheus + Grafana stack',
        status: 'active',
      },
      {
        address: '10.0.4.2',
        name: 'Log Aggregator',
        description: 'ELK stack (Elasticsearch)',
        status: 'active',
      },
      {
        address: '10.0.4.3',
        name: 'Alert Manager',
        description: 'PagerDuty relay',
        status: 'active',
      },
      {
        address: '10.0.5.1',
        name: 'Docker Registry',
        description: 'Private container registry',
        status: 'active',
      },
      {
        address: '10.0.5.50',
        name: 'Old Staging Box',
        description: 'Retired staging server',
        status: 'deprecated',
      },
      {
        address: '10.0.5.51',
        name: 'Old CI Agent',
        description: 'Replaced by Runner 2',
        status: 'deprecated',
      },
      {
        address: '10.0.10.1',
        name: 'Dev Sandbox 1',
        description: 'Developer sandbox environment',
        status: 'reserved',
      },
      {
        address: '10.0.10.2',
        name: 'Dev Sandbox 2',
        description: 'Developer sandbox environment',
        status: 'reserved',
      },
    ],
  },
  {
    subnet: { cidr: '172.16.0.0/20', name: 'Staging', description: 'Staging environment' },
    ips: [
      {
        address: '172.16.0.2',
        name: 'Staging DNS',
        description: 'Staging DNS resolver',
        status: 'active',
      },
      {
        address: '172.16.0.10',
        name: 'Load Balancer',
        description: 'HAProxy primary',
        status: 'active',
      },
      {
        address: '172.16.0.11',
        name: 'LB Failover',
        description: 'HAProxy standby',
        status: 'reserved',
      },
      {
        address: '172.16.0.20',
        name: 'App Server 1',
        description: 'Node.js application node',
        status: 'active',
      },
      {
        address: '172.16.0.21',
        name: 'App Server 2',
        description: 'Node.js application node',
        status: 'active',
      },
      {
        address: '172.16.0.22',
        name: 'App Server 3',
        description: 'Node.js application node (scale-up)',
        status: 'reserved',
      },
      {
        address: '172.16.0.30',
        name: 'DB Master',
        description: 'PostgreSQL primary',
        status: 'active',
      },
      {
        address: '172.16.0.31',
        name: 'DB Slave',
        description: 'PostgreSQL streaming replica',
        status: 'active',
      },
      {
        address: '172.16.0.40',
        name: 'Redis Primary',
        description: 'Redis Sentinel primary',
        status: 'active',
      },
      {
        address: '172.16.0.41',
        name: 'Redis Replica',
        description: 'Redis Sentinel replica',
        status: 'active',
      },
      {
        address: '172.16.0.50',
        name: 'Elasticsearch',
        description: 'Search engine cluster node',
        status: 'active',
      },
      {
        address: '172.16.0.60',
        name: 'RabbitMQ',
        description: 'Message broker',
        status: 'active',
      },
      {
        address: '172.16.0.70',
        name: 'Monitoring',
        description: 'Grafana + Prometheus',
        status: 'active',
      },
      {
        address: '172.16.0.80',
        name: 'Bastion Host',
        description: 'SSH jump server',
        status: 'active',
      },
      {
        address: '172.16.0.90',
        name: 'Legacy Worker',
        description: 'Old cron job server — migrating',
        status: 'deprecated',
      },
      {
        address: '172.16.0.100',
        name: 'S3 Gateway',
        description: 'MinIO object storage',
        status: 'active',
      },
    ],
  },
];

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [User, Subnet, Ip],
    synchronize: true,
  });

  await dataSource.initialize();
  console.log('Database connected for seeding...');

  const userRepo = dataSource.getRepository(User);
  const subnetRepo = dataSource.getRepository(Subnet);
  const ipRepo = dataSource.getRepository(Ip);

  const existingUser = await userRepo.findOne({ where: { email: DEMO_EMAIL } });
  if (existingUser) {
    console.log('Seed data already exists. Skipping...');
    await dataSource.destroy();
    return;
  }

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 12);
  const user = await userRepo.save(
    userRepo.create({ email: DEMO_EMAIL, password: hashedPassword }),
  );
  console.log(`Created demo user: ${DEMO_EMAIL}`);

  for (const entry of SAMPLE_DATA) {
    const reservedIps = getReservedIps(entry.subnet.cidr);
    const totalIps = reservedIps.length + entry.ips.length;

    const subnet = await subnetRepo.save(
      subnetRepo.create({
        ...entry.subnet,
        totalIps,
        createdById: user.id,
      }),
    );
    console.log(`Created subnet: ${entry.subnet.cidr}`);

    for (const rip of reservedIps) {
      await ipRepo.save(
        ipRepo.create({
          address: rip.address,
          name: rip.name,
          description: rip.description,
          status: 'reserved',
          subnetId: subnet.id,
          createdById: user.id,
        }),
      );
    }
    console.log(`  Auto-reserved ${reservedIps.length} infrastructure IPs`);

    for (const ipData of entry.ips) {
      await ipRepo.save(ipRepo.create({ ...ipData, subnetId: subnet.id, createdById: user.id }));
    }
    console.log(`  Added ${entry.ips.length} user-defined IP addresses`);
  }

  console.log('Seeding complete!');
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
