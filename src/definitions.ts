export interface Book {
    id: number;
    title: string;
    genre: string;
    pages: number;
    price: number;
    author: string;
    year: number;
}

export enum DiscountCode {
    BlackFriday = 0.20,
    EndOfSummer = 0.10,
    Christmas = 0.25
}

export interface Order {
    id: number;
    orderLines: Array<OrderLine>;
    discount?: DiscountCode;
    total?: number;
}

export interface OrderLine {
    bookId: number;
    quantity: number;
}

/// UTILS

const intFrom = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

function randomDiscount(): DiscountCode {
    const rand = intFrom(0, 2);
    return rand === 0 ?
        DiscountCode.BlackFriday
        : rand === 1
            ? DiscountCode.Christmas
            : DiscountCode.EndOfSummer;
}

const generateOrderLines = (length: number): Array<OrderLine> => Array.from({ length }, () => ({
    bookId: intFrom(1, 1000),
    quantity: intFrom(1, 3)
})) as Array<OrderLine>;

export function generateOrder(index: number): Order {
    return {
        id: index + 1,
        ...(Math.random() > 0.7 ? { discount: randomDiscount() } : {}),
        orderLines: generateOrderLines(intFrom(1, 10))
    } as Order;
}

export function generateBookReview(bookId: number): [number, Array<number>] {
    return [bookId, Array.from({ length: intFrom(1, 10) }, () => intFrom(1, 10))];
}
