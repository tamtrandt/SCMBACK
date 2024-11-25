import { IsOptional } from 'class-validator';
import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Product {
 @PrimaryGeneratedColumn()
  id: number;

  @Column()
  TokenId: number;

  @Column() 
  qrcode: string; 
}
