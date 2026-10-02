import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onChange: (page: number) => void;
  noun?: [string, string];
}

function pagesToShow(page: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '…')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) pages.push('…');
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push('…');
  pages.push(total);
  return pages;
}

export function Pagination({ page, totalPages, totalItems, pageSize, onChange, noun = ['item', 'itens'] }: PaginationProps) {
  if (totalItems === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <nav className="pagination" aria-label="Paginação">
      <span className="pagination__info">
        {from}–{to} de {totalItems} {totalItems === 1 ? noun[0] : noun[1]}
      </span>
      {totalPages > 1 && (
        <div className="pagination__pages">
          <button type="button" className="pagination__page" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Página anterior">
            <LuChevronLeft />
          </button>
          {pagesToShow(page, totalPages).map((p, i) =>
            p === '…' ? (
              <span key={`e${i}`} className="pagination__ellipsis">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className="pagination__page"
                aria-current={p === page ? 'page' : undefined}
                onClick={() => onChange(p)}
              >
                {p}
              </button>
            ),
          )}
          <button type="button" className="pagination__page" onClick={() => onChange(page + 1)} disabled={page >= totalPages} aria-label="Próxima página">
            <LuChevronRight />
          </button>
        </div>
      )}
    </nav>
  );
}
