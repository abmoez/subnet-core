import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { Subnet } from '../../subnets/entities/subnet.entity';
import { User } from '../../users/entities/user.entity';

@Entity('ips')
export class Ip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  address: string;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'varchar' })
  description: string | null;

  @Column({ default: 'active' })
  status: string;

  @Index()
  @Column()
  subnetId: string;

  @ManyToOne(() => Subnet, (subnet) => subnet.ips, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subnetId' })
  subnet: Subnet;

  @Index()
  @Column()
  createdById: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Index()
  @Column({ nullable: true })
  updatedById: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'updatedById' })
  updatedBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
