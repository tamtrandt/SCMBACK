import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  product_name: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  quantity: number;

  @Column()
  status: string;

  @Column('simple-array')
  images: string[];

  @Column('simple-array')
  files: string[];

  @Column({ nullable: true }) // Cho phép null nếu chưa có dữ liệu IPFS
  ipfsUrl: string;

  @Column({ nullable: true }) // Block hash có thể null ban đầu
  blockHash: string;
}