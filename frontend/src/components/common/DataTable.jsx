export default function DataTable({ columns, rows, onRowClick, selectedId, rowKey = '_id' }) {
  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>{columns.map((c) => <th key={c.key} scope="col">{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row[rowKey]}
              className={`${onRowClick ? 'clickable' : ''} ${selectedId === row[rowKey] ? 'selected' : ''}`}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((c) => <td key={c.key}>{c.render ? c.render(row) : row[c.key] ?? '-'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
