import { bookReviews, books, orders } from './data';
import { Book, Order, OrderLine } from './definitions';

console.clear();

function log(message: string, params: any) {
    console.log(`%c${ message }`, 'padding: 10px; background-color: black; color: white; font-size: 14px', params);
}

// 1

const NO_GENRE = '(no genres listed)';

const hasGenre = (b: Book) => b.genre !== NO_GENRE;

const booksWithGenre: Array<Book> = books.filter(hasGenre);
/*
log('Libros con género:', booksWithGenre.length);
*/
// 2

function distinctValues(values: Array<string>, distinct: Array<string> = []): Array<string> {
    return !values.length
        ? distinct
        : distinctValues(values.slice(1), distinct.includes(values[0]) ? distinct : [...distinct, values[0]]);
}

const select = (prop: keyof Book) => (b: Book) => b[prop];

const allBooksGenres = booksWithGenre
    .map(select('genre'))
    .map((_: string) => _.split('|'))
    .flatMap(_ => _);

const distinctGenres = distinctValues(allBooksGenres);
/*
log('Cuántos géneros distintos tenemos entre todos nuestros libros?', distinctGenres);
*/
// 3

// 3.1
const booksCountPerGenre = allBooksGenres
    .reduce(
        (acc, genre) => ({
            ...acc,
            [genre]: acc[genre] + 1
        }),

        distinctGenres.reduce((acc, cur) => ({
            ...acc,
            [cur]: 0
        }), {})
    );
/*
log('Listar/Agrupar los libros por género',
    booksCountPerGenre
);
*/
// 3.2: preferida

type NumberPerGenre = [string, number];

const genresAndCount = booksWithGenre
    .map(_ => _.genre.split('|')).flatMap(_ => _)
    .reduce((acc, cur) => {
            const genreFound: NumberPerGenre = acc.find(([genre]) => genre === cur);
            const entries: Array<NumberPerGenre> = acc.filter(([genre]) => genre !== cur);
            const [genre, count]: NumberPerGenre = genreFound || [cur, 0];

            return [...entries, [genre, count + 1]];
        },
        []);
/*
log('Listar/Agrupar los libros por género',
    genresAndCount
);
*/
// 4

const calculateOrderAmount = (order: Order) => order.orderLines.reduce((acc: number, line: OrderLine) =>
    acc + books.find(_ => _.id === line.bookId).price * line.quantity
    , 0);
/*
log('Puesto que cada Order tiene un total, pero no está calculado, se pide actualizar cada order con su total',
    orders.map((order: Order) => {
        const total = calculateOrderAmount(order);
        return {
            ...order,
            total: (total - (!!order.discount ? total * order.discount : 0)).toFixed(2)
        };
    }));

*/

// 5

type Predicate<T = Book | Order | OrderLine> = (param: T) => boolean;

const where = <T = Book | Order | OrderLine>(conditions: Array<Predicate<T>>) => (p: T) => conditions.every(c => c(p));

const thrillerBooksUnder15$: Array<Predicate<Book>> = [
    b => b.genre.includes('Thriller'), b => b.price < 15
];
/*
log('¿Cuántos libros del género thriller con un precio menos a 15$ tenemos?',
    books.filter(where<Book>(thrillerBooksUnder15$))
);
*/
// 6

const sortAsc = (a: [any, number], b: [any, number]) => a[1] - b[1];
const sortDesc = (a: [any, number], b: [any, number]) => b[1] - a[1];

const getTopNBySorting = (n: number, sortFunction: (a, b) => number, items: Array<any>) => items.sort(sortFunction).slice(0, n);
/*
log(' los 3 géneros con menos libros',
    genresAndCount.sort(sortAsc).slice(0, 3).map(_ => _[0])
);

log(' los 3 géneros con más libros',
    genresAndCount.sort(sortDesc).slice(0, 3).map(_ => _[0])
);
*/
// 7
console.time('Tiempo de proceso de la solución NO ÓPTIMA');
// Solución no óptima, aunque declaramos predicados y funciones que nos serán útiles más adelante

// Predicado para preguntar si un libro e sde un género concreto
const isBookOfGenre = (genre: string) => (book: Book) => book.genre.toLowerCase().includes(genre.toLowerCase());

// Definimos un nuevo tipo para agrupar id de libro con su precio
type BookIdAndPrice = [number, number];

// Con el tipo anterior, podemos sacar una lista de todos los ids de libros y su precio que son del género fantasy
const fantasyBooksIdAndPrice: Array<BookIdAndPrice> = booksWithGenre.filter(isBookOfGenre('Fantasy')).map(book => [book.id, book.price]);

// Aplanamos todos los orderlines
const allOrderLines = orders.map(o => o.orderLines).flatMap(_ => _);

// Cogemos todos los ids de los libros de fantasy
const fantasyBookIds = fantasyBooksIdAndPrice.map(([id]) => id);

// Y con estos ids podemos filtrar las líneas que nos interesan, las que incluyen estos libros
const fantasyOrderLines = allOrderLines.filter(l => fantasyBookIds.includes(l.bookId));

// Hacemos una función de búsqueda de precio a partir de un id, buscando en el array que hemos rellenado con [id, price] de todos los libros de fantasy
const getFantasyBookPrice = (id: number) => fantasyBooksIdAndPrice.find(([bookId, price]) => id === bookId)[1];


// solamente nos queda reducir el set de datos
const earnedByFantasy = fantasyOrderLines
.reduce((acc, cur: OrderLine) => acc + (cur.quantity * getFantasyBookPrice(cur.bookId)), 0);

log('¿Cuánto dinero hemos ganado con los libros del género Fantasy?', earnedByFantasy.toFixed(2));

console.timeEnd('Tiempo de proceso de la solución NO ÓPTIMA');
///

// 8

const earnedByGenre = (genre: string) => (books: Array<Book>) =>
    books.filter(b => isBookOfGenre(genre)(b)).reduce((acc, cur) => acc + cur.price, 0);

log('¿Cuáles son los 3 géneros con más ingresos?',
    distinctGenres.map(genre => ([genre, earnedByGenre(genre)(booksWithGenre)]))
                  .sort(sortDesc)
                  .slice(0, 3)
                  .map(_ => _[0])
);

// 9


type BookIdAndCounter = [number, number];

const soldestBook: BookIdAndCounter = allOrderLines
    .reduce((acc, cur) => {
        const bookIdFound: BookIdAndCounter = acc.find(([bookId]) => bookId === cur.bookId);
        const entries: Array<BookIdAndCounter> = acc.filter(([bookId]) => bookId !== cur.bookId);
        const [bookId, count] = bookIdFound || [cur.bookId, 0];

        return [...entries, [bookId, count + cur.quantity]];
    }, [])
    .sort(sortDesc)
    [0];

const pick = <T>(properties: Array<keyof T>) => (item: T) => properties.reduce((acc, cur) => ({
    ...acc,
    [cur]: item[cur]
}), {});
/*
log('¿Cual es el título, autor y precio del libro con el que hemos ingresado más?',
    pick<Book>(['title', 'author', 'price'])(books.find(_ => _.id === soldestBook[0]))
);
*/
// 10

function zip<T, K>(array1: Array<T>, array2: Array<K>, accum: Array<[T, K]> = []): Array<[T, K]> {
    return !array1.length || !array2.length
        ? accum
        : zip(array1.slice(1), array2.slice(1), [...accum, [array1[0], array2[0]]]);
}
/*
log('Mediante la función zip implementada, sacar un listado conteniendo pares con la forma',
    zip(
        books.map(select('title')),
        bookReviews.map(([, reviews]: [number, Array<number>]) => (reviews
            .reduce((acc, cur) => acc + cur, 0) / reviews.length).toFixed(2))
    )
);
*/