import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  user_id: string;

  @Column()
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  phone: string;

  @Column()
  address: string;

  @Column({ default: 'customer' }) 
  role: string;

  @Column({ default: false })
  isactive: boolean;

  @Column({ nullable: true })
  code_id: string;

  @Column({ nullable: true })
  code_expired: Date;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  create_at: Date;
}

