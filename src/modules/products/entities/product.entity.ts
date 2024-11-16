import { IsOptional } from 'class-validator';
import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm';

@Entity()
export class Product {
  @PrimaryColumn()
  id: string;

  @Column()
  transactionHash: string;

  @IsOptional()
  @CreateDateColumn()
  create_at: Date;

  @IsOptional()
  @UpdateDateColumn()
  update_at: Date;

  @Column("text", { array: true }) 
  qrcode: string[]; 
}
