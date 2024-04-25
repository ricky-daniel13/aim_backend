import { InvoiceProduct } from "./product"

export type Invoice = {
    id: number,
    clientName: string,
    clientEmail: string,
    date: Date,
    discount: number,
    imageUrl: string|null,
    products: InvoiceProduct[]
}