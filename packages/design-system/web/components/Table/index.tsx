import { createContext, ReactNode, useContext, useState, useMemo } from 'react';
import styles from './Table.module.css';

export interface ColumnDef<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  width?: string;
  Cell?: (props: { value: unknown; row: T }) => ReactNode;
  sortable?: boolean;
}

interface TableContextProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  sortColumn: keyof T | null;
  sortDirection: 'asc' | 'desc' | null;
  onSortData: (column: keyof T) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  selectedRows: T[];
  toggleRowSelection: (row: T) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TableContext = createContext<TableContextProps<any> | undefined>(
  undefined,
);

interface TableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  pageSize?: number;
  onRowSelect?: (selectedRows: T[]) => void;
  children: ReactNode;
}

export function Table<T>({
  columns,
  data,
  pageSize = 10,
  onRowSelect,
  children,
}: TableProps<T>) {
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<T[]>([]);

  const onSortData = (column: keyof T) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortColumn) return data;
    return [...data].sort((a, b) => {
      if (a[sortColumn] < b[sortColumn])
        return sortDirection === 'asc' ? -1 : 1;
      if (a[sortColumn] > b[sortColumn])
        return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortColumn, sortDirection]);

  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const totalPages = Math.ceil(sortedData.length / pageSize);

  const toggleRowSelection = (row: T) => {
    const newSelection = selectedRows.includes(row)
      ? selectedRows.filter((r) => r !== row)
      : [...selectedRows, row];
    setSelectedRows(newSelection);
    onRowSelect?.(newSelection);
  };

  return (
    <TableContext.Provider
      value={{
        columns,
        data: paginatedData,
        sortColumn,
        sortDirection,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment
        // @ts-ignore
        onSortData,
        currentPage,
        totalPages,
        setCurrentPage,
        selectedRows,
        toggleRowSelection,
      }}>
      <div className={styles.table} role="table">
        {children}
      </div>
    </TableContext.Provider>
  );
}

function Header<T>() {
  const context = useContext(TableContext) as TableContextProps<T>;
  if (!context) throw new Error('Header must be used within a Table');
  const { columns, onSortData, sortColumn, sortDirection } = context;
  return (
    <div className={`${styles.header} ${styles.common_row}`} role="row">
      {columns.map((column, index) => (
        <div
          key={index}
          style={{ width: column.width }}
          onClick={() =>
            column.sortable && onSortData(column.accessor as keyof T)
          }
          className={column.sortable ? styles.sortable : ''}>
          {column.header}
          {column.sortable && sortColumn === column.accessor && (
            <span>{sortDirection === 'asc' ? '▲' : '▼'}</span>
          )}
        </div>
      ))}
    </div>
  );
}

interface RowProps<T> {
  item: T;
}

function Row<T>({ item }: RowProps<T>) {
  const context = useContext(TableContext) as TableContextProps<T>;
  if (!context) throw new Error('Row must be used within a Table');
  const { columns, toggleRowSelection, selectedRows } = context;
  const isSelected = selectedRows.includes(item);

  return (
    <div
      className={`${styles.row} ${styles.common_row} ${isSelected ? styles.selected : ''}`}
      role="row"
      onClick={() => toggleRowSelection(item)}>
      {columns.map((column, index) => (
        <Cell key={index} column={column} row={item} />
      ))}
    </div>
  );
}

function Cell<T>({ column, row }: { column: ColumnDef<T>; row: T }) {
  const value =
    typeof column.accessor === 'function'
      ? column.accessor(row)
      : row[column.accessor as keyof T];
  return (
    <div style={{ width: column.width }}>
      {column.Cell ? (
        <column.Cell value={value} row={row} />
      ) : (
        <div>{value as ReactNode}</div>
      )}
    </div>
  );
}

interface BodyProps {
  empty?: ReactNode;
}

function Body<T>({ empty }: BodyProps) {
  const context = useContext(TableContext) as TableContextProps<T>;
  if (!context) throw new Error('Body must be used within a Table');
  const { data } = context;

  if (!data?.length) return <>{empty}</>;

  return (
    <section className={styles.body}>
      {data.map((item, index) => (
        <Row key={index} item={item} />
      ))}
    </section>
  );
}

function Footer<T>() {
  const context = useContext(TableContext) as TableContextProps<T>;
  if (!context) throw new Error('Footer must be used within a Table');
  const { currentPage, totalPages, setCurrentPage } = context;

  return (
    <footer className={styles.footer}>
      <button
        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}>
        Previous
      </button>
      <span>{`Page ${currentPage} of ${totalPages}`}</span>
      <button
        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}>
        Next
      </button>
    </footer>
  );
}

Table.Header = Header;
Table.Body = Body;
Table.Footer = Footer;
