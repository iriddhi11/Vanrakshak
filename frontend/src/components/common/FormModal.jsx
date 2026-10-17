import { useState } from 'react';
import Modal from './Modal.jsx';
import { toInputDate, toInputDateTime } from '../../utils/format.js';

const getIn = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
const setIn = (obj, path, value) => {
  const keys = path.split('.');
  let cur = obj;
  keys.slice(0, -1).forEach((k) => { cur[k] = cur[k] || {}; cur = cur[k]; });
  cur[keys[keys.length - 1]] = value;
};

function initialValue(field, source) {
  const v = getIn(source, field.name) ?? field.defaultValue;
  if (v === undefined || v === null) return '';
  if (field.type === 'datetime-local') return toInputDateTime(v);
  if (field.type === 'date') return toInputDate(v);
  return v;
}

/**
 * Generic create/edit dialog. fields: [{ name (dot paths ok), label, type, options, required, full, ... }]
 * onSubmit receives a nested object ready for the API.
 */
export default function FormModal({ title, fields, initialValues = {}, submitLabel = 'Save', onSubmit, onClose, children }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((f) => [f.name, initialValue(f, initialValues)])));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = {};
    fields.forEach((f) => {
      let v = values[f.name];
      if (v === '' || v === undefined) return;
      if (f.type === 'number') v = Number(v);
      if (f.type === 'datetime-local' || f.type === 'date') v = new Date(v).toISOString();
      setIn(payload, f.name, v);
    });
    setSaving(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate={false}>
        {error && <div className="form-error" role="alert">{error}</div>}
        {children}
        <div className="form-grid">
          {fields.map((f) => {
            const id = `f-${f.name}`;
            const common = { id, required: f.required, value: values[f.name], onChange: (e) => setValues((s) => ({ ...s, [f.name]: e.target.value })) };
            return (
              <div key={f.name} className={`field ${f.full || f.type === 'textarea' ? 'full' : ''}`}>
                <label htmlFor={id}>{f.label}{f.required && <span className="req"> *</span>}</label>
                {f.type === 'select' ? (
                  <select className="select" {...common}>
                    {!f.required && <option value="">-</option>}
                    {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea className="textarea" placeholder={f.placeholder} {...common} />
                ) : (
                  <input className="input" type={f.type || 'text'} placeholder={f.placeholder} step={f.step} min={f.min} max={f.max} minLength={f.minLength} {...common} />
                )}
                {f.hint && <span className="small muted">{f.hint}</span>}
              </div>
            );
          })}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-green" disabled={saving}>{saving ? 'Saving...' : submitLabel}</button>
        </div>
      </form>
    </Modal>
  );
}
