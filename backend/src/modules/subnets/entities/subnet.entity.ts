import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Ip } from '../../ips/entities/ip.entity';

@Entity('subnets')
export class Subnet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  cidr: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 0 })
  totalIps: number;

  @Index()
  @Column()
  createdById: string;

  @ManyToOne(() => User, (user) => user.subnets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Index()
  @Column({ nullable: true })
  updatedById: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'updatedById' })
  updatedBy: User;

  @OneToMany(() => Ip, (ip) => ip.subnet)
  ips: Ip[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
