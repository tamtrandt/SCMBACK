export interface DataProductOnchain {
    id: string; 
    name: string;
    description: string; 
    price: number; 
    quantity: number; 
    brand: string; 
    category: string; 
    size: string; 
    status: string; 
    imagecids: string[]; 
    filecids: string[];
    creater: string;
}