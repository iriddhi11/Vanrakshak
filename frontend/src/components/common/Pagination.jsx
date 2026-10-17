export default function Pagination({ page, pages, total, onChange }) {
  return (
    <div className="pager">
      <span>{total} record{total === 1 ? '' : 's'} - Page {page} of {pages}</span>
      <div className="pager-btns">
        <button type="button" className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
        <button type="button" className="btn btn-secondary btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button>
      </div>
    </div>
  );
}
