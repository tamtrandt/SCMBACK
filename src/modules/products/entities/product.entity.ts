import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm';

@Entity()
export class Product {
  @PrimaryColumn()
  id: string;

  @Column()
  transactionHash: string;

 @CreateDateColumn()
  create_at: Date;

  @UpdateDateColumn()
  update_at: Date;


  @Column("text", { array: true }) // Đổi kiểu dữ liệu thành JSON để lưu mảng
  qrcode: string[]; // Lưu trữ tập hợp QR codes dưới dạng mảng
}
