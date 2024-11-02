export interface DataProductOnchain {
    id: string; // ID sản phẩm, kiểu string (UUID)
    name: string; // Tên sản phẩm
    description: string; // Mô tả sản phẩm
    price: number; // Giá sản phẩm, kiểu string (đã chuyển đổi từ number)
    quantity: number; // Số lượng sản phẩm
    brand: string; // Thương hiệu sản phẩm
    category: string; // Danh mục sản phẩm
    size: string; // Kích thước sản phẩm
    status: string; // Trạng thái sản phẩm

    imagecids: string[]; // Mảng CIDs của các tệp trên IPFS
    filecids: string[];
    creater: string;
}