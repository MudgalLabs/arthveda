export type Setter<T> = (value: T[] | ((prev: T[]) => T[])) => void;

export interface Sorting {
    field: string;
    order: "asc" | "desc";
}

export interface Pagination {
    /** Should be >= 1 */
    page: number;
    /** Should be >= 1 and <= 100 */
    limit: number;
}

export interface PaginationMeta extends Pagination {
    total_items: number;
    total_pages: number;
}

export interface DateRangeFilter {
    from?: Date;
    to?: Date;
}

export interface SearchRequest<TFilters> {
    filters?: Partial<TFilters>;
    sort?: Sorting;
    pagination?: Pagination;
}

export interface SearchResponse<TItems> {
    items: TItems;
    pagination: PaginationMeta;
}

export type DecimalString = string;
