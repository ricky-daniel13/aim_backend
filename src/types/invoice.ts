import { InvoiceProduct } from "./invoiceproduct"

export type Invoice = {
    id: number,
    clientName: string,
    clientEmail: string,
    date: Date,
    discount: number,
    imageUrl: string|null,
    products: InvoiceProduct[]
}