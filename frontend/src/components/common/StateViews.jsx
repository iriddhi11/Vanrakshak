export function Loader({ text = 'Loading...' }) {
  return <div className="loader" role="status">{text}</div>;
}

export function EmptyState({ text = 'No records found.' }) {
  return <div className="empty">{text}</div>;
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="error-box" role="alert">
      <span>{message}</span>
      {onRetry && <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>Try again</button>}
    </div>
  );
}

/** Renders loader / error / empty / children for a useFetch result. */
export function AsyncView({ state, isEmpty, emptyText, children }) {
  if (state.loading && !state.data) return <Loader />;
  if (state.error) return <ErrorState message={state.error} onRetry={state.reload} />;
  if (isEmpty) return <EmptyState text={emptyText} />;
  return children;
}
