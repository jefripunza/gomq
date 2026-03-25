import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  type Ref,
  type ReactNode,
} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import {
  HiOutlineSearch,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineChevronUp,
} from "react-icons/hi";
import { useLanguageStore } from "@/stores/languageStore";
import type { WithPagination } from "@/types/response";

interface PaginationFetchParams {
  page: number;
  limit: number;
  search?: string;
  sort_by?: string;
  sort_order?: "ASC" | "DESC";
  search_fields?: string;
}

export interface PaginationHelpers<T> {
  reload: () => Promise<void>;
  setRows: (updater: T[] | ((prev: T[]) => T[])) => void;
}

export interface PaginationColumn<T> {
  header: string;
  strict?: boolean;
  align?: "left" | "center" | "right";
  sort?: boolean;
  search?: string;
  headerClassName?: string;
  cellClassName?: string;
  render: (row: T, index: number, helpers: PaginationHelpers<T>) => ReactNode;
}

interface PaginationProps<T> {
  title: string;
  columns: PaginationColumn<T>[];
  function: (params: PaginationFetchParams) => Promise<WithPagination<T>>;
}

export interface PaginationHandle {
  reload: () => Promise<void>;
}

const Pagination = forwardRef(function PaginationInner<T>(
  { title, columns, function: fetchFunction }: PaginationProps<T>,
  ref: Ref<PaginationHandle>,
) {
  const { language } = useLanguageStore();
  const [rows, setRows] = useState<T[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const searchableFields = useMemo(() => {
    return columns
      .map((column) => column.search?.trim())
      .filter((field): field is string => Boolean(field));
  }, [columns]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  const fetchRows = useCallback(
    async (
      page = currentPage,
      q = debouncedSearch,
      l = limit,
      sb = sortBy,
      so = sortOrder,
    ) => {
      setIsLoading(true);
      try {
        const data = await fetchFunction({
          page,
          limit: l,
          search: q || undefined,
          sort_by: sb,
          sort_order: so,
          search_fields:
            searchableFields.length > 0
              ? searchableFields.join(",")
              : undefined,
        });

        setRows(data.rows ?? []);
        setTotal(data.pagination.total ?? 0);
        setTotalPages(Math.max(1, data.pagination.total_pages ?? 1));

        if (
          page > (data.pagination.total_pages ?? 1) &&
          (data.pagination.total_pages ?? 1) > 0
        ) {
          setCurrentPage(data.pagination.total_pages);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      currentPage,
      debouncedSearch,
      fetchFunction,
      limit,
      sortBy,
      sortOrder,
      searchableFields,
    ],
  );

  useEffect(() => {
    fetchRows(currentPage, debouncedSearch, limit, sortBy, sortOrder);
  }, [currentPage, debouncedSearch, fetchRows, limit, sortBy, sortOrder]);

  useImperativeHandle(ref, () => ({
    reload: async () => {
      await fetchRows(currentPage, debouncedSearch, limit, sortBy, sortOrder);
    },
  }));

  const paginationWindow = useMemo(() => {
    const windowSize = 5;
    let start = Math.max(1, safeCurrentPage - Math.floor(windowSize / 2));
    const end = Math.min(totalPages, start + windowSize - 1);
    if (end - start + 1 < windowSize) {
      start = Math.max(1, end - windowSize + 1);
    }
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [safeCurrentPage, totalPages]);

  const helpers = useMemo<PaginationHelpers<T>>(
    () => ({
      reload: async () => {
        await fetchRows(currentPage, debouncedSearch, limit, sortBy, sortOrder);
      },
      setRows,
    }),
    [currentPage, debouncedSearch, fetchRows, limit, sortBy, sortOrder],
  );

  const getAlignClassName = (align?: "left" | "center" | "right") => {
    if (align === "center") return "text-center";
    if (align === "right") return "text-right";
    return "text-left";
  };

  const getHeaderButtonClassName = (align?: "left" | "center" | "right") => {
    if (align === "center") return "justify-center";
    if (align === "right") return "justify-end";
    return "justify-start";
  };

  const getStrictHeaderButtonClassName = (
    align?: "left" | "center" | "right",
  ) => {
    if (align === "center") return "mx-auto";
    if (align === "right") return "ml-auto";
    return "";
  };

  const from = total === 0 ? 0 : (safeCurrentPage - 1) * limit + 1;
  const to =
    total === 0
      ? 0
      : Math.min((safeCurrentPage - 1) * limit + rows.length, total);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative">
              <HiOutlineSearch
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400"
              />
              <Input
                placeholder={language("Cari data...", "Search data...")}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-64 pl-9"
              />
            </div>
            <Select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-20"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.header}
                  className={`${getAlignClassName(column.align)} ${column.strict ? "w-px whitespace-nowrap" : ""} ${column.headerClassName ?? ""}`.trim()}
                >
                  {column.sort && column.search ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (sortBy === column.search) {
                          setSortOrder((prev) =>
                            prev === "ASC" ? "DESC" : "ASC",
                          );
                        } else {
                          setSortBy(column.search);
                          setSortOrder("ASC");
                        }
                        setCurrentPage(1);
                      }}
                      className={`${
                        column.strict
                          ? `inline-flex items-center gap-2 ${getStrictHeaderButtonClassName(column.align)}`
                          : `flex w-full items-center gap-2 ${getHeaderButtonClassName(column.align)}`
                      }`.trim()}
                    >
                      <span>{column.header}</span>
                      <span className="text-dark-400">
                        <HiOutlineChevronUp
                          size={14}
                          className={
                            sortBy === column.search
                              ? sortOrder === "ASC"
                                ? ""
                                : "rotate-180"
                              : "opacity-30"
                          }
                        />
                      </span>
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-8 text-center text-dark-400"
                >
                  {isLoading
                    ? language("Memuat data...", "Loading data...")
                    : language("Tidak ada data ditemukan", "No data found")}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => {
                const key =
                  typeof row === "object" && row !== null && "id" in row
                    ? String((row as { id?: string | number }).id ?? idx)
                    : String(idx);

                return (
                  <TableRow key={key}>
                    {columns.map((column) => (
                      <TableCell
                        key={`${key}-${column.header}`}
                        className={`${getAlignClassName(column.align)} ${column.strict ? "w-px whitespace-nowrap" : ""} ${column.cellClassName ?? ""}`.trim()}
                      >
                        {column.render(row, idx, helpers)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-dark-400">
            {language("Menampilkan", "Showing")} {from} - {to}{" "}
            {language("dari", "of")} {total} {language("data", "items")}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <HiOutlineChevronLeft size={14} />
              {language("Sebelumnya", "Prev")}
            </Button>

            {paginationWindow[0] > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                >
                  1
                </Button>
                {paginationWindow[0] > 2 && (
                  <span className="px-1 text-xs text-dark-400">...</span>
                )}
              </>
            )}

            {paginationWindow.map((page) => (
              <Button
                key={page}
                variant={page === safeCurrentPage ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}

            {paginationWindow[paginationWindow.length - 1] < totalPages && (
              <>
                {paginationWindow[paginationWindow.length - 1] <
                  totalPages - 1 && (
                  <span className="px-1 text-xs text-dark-400">...</span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              {language("Berikutnya", "Next")}
              <HiOutlineChevronRight size={14} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}) as <T>(
  props: PaginationProps<T> & { ref?: Ref<PaginationHandle> },
) => ReactNode;

export default Pagination;
