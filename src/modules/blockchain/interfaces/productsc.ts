export interface ProductSC {
    id: string;
    name: string;
    description: string;
    price: number;
    quantity: number;
    status: string;
    ipfsUrl: string;
    //blockHash: string; // Để lưu trữ mã hash của block chứa thông tin giao dịch
}