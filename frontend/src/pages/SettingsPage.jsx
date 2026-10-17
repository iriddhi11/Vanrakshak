import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Badge from '../components/common/Badge.jsx';
import DataTable from '../components/common/DataTable.jsx';
import FormModal from '../components/common/FormModal.jsx';
import { AsyncView } from '../components/common/StateViews.jsx';
import useFetch from '../hooks/useFetch.js';
import { authApi, usersApi } from '../api/resources.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ROLES } from '../config/constants.js';

const USER_FIELDS = [
  { name: 'name', label: 'Full name', required: true },
  { name: 'email', label: 'Official email', type: 'email', required: true },
  { name: 'password', label: 'Temporary password', type: 'password', required: true, minLength: 8, hint: 'At least 8 characters.' },
  { name: 'role', label: 'Role', type: 'select', required: true, options: ROLES, defaultValue: 'ranger' },
  { name: 'designation', label: 'Designation' },
  { name: 'range', label: 'Range / office' },
];

function ProfileForm() {
  const { user, setUser } = useAuth();
  const { notify } = useToast();
  const [form, setForm] = useState({ name: user.name || '', designation: user.designation || '', range: user.range || '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { setUser(await authApi.updateProfile(form)); notify('Profile updated'); } catch (err) { notify(err.message, 'error'); }
    setBusy(false);
  };
  const bind = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  return (
    <section className="card">
      <div className="card-head"><h2>My profile</h2></div>
      <form className="card-body" onSubmit={submit}>
        <div className="form-grid">
          <div className="field"><label htmlFor="p-name">Full name</label><input id="p-name" className="input" required {...bind('name')} /></div>
          <div className="field"><label htmlFor="p-email">Email</label><input id="p-email" className="input" value={user.email} disabled /></div>
          <div className="field"><label htmlFor="p-des">Designation</label><input id="p-des" className="input" {...bind('designation')} /></div>
          <div className="field"><label htmlFor="p-range">Range / office</label><input id="p-range" className="input" {...bind('range')} /></div>
        </div>
        <div className="modal-actions"><button type="submit" className="btn btn-green" disabled={busy}>Save profile</button></div>
      </form>
    </section>
  );
}

function PasswordForm() {
  const { notify } = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) return notify('New passwords do not match', 'error');
    setBusy(true);
    try {
      await authApi.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      notify('Password changed');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { notify(err.message, 'error'); }
    setBusy(false);
    return undefined;
  };
  const bind = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  return (
    <section className="card">
      <div className="card-head"><h2>Change password</h2></div>
      <form className="card-body" onSubmit={submit}>
        <div className="form-grid">
          <div className="field full"><label htmlFor="c-cur">Current password</label><input id="c-cur" type="password" className="input" autoComplete="current-password" required {...bind('currentPassword')} /></div>
          <div className="field"><label htmlFor="c-new">New password</label><input id="c-new" type="password" className="input" autoComplete="new-password" minLength={8} required {...bind('newPassword')} /></div>
          <div className="field"><label htmlFor="c-conf">Confirm new password</label><input id="c-conf" type="password" className="input" autoComplete="new-password" minLength={8} required {...bind('confirm')} /></div>
        </div>
        <div className="modal-actions"><button type="submit" className="btn btn-green" disabled={busy}>Update password</button></div>
      </form>
    </section>
  );
}

function UserAdmin() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [adding, setAdding] = useState(false);
  const state = useFetch(() => usersApi.list({ limit: 100 }), []);
  const rows = state.data?.items || [];

  const create = async (payload) => { await usersApi.create(payload); notify('User created'); setAdding(false); state.reload(); };
  const toggle = async (u) => {
    try { await usersApi.setActive(u._id, !u.isActive); notify(u.isActive ? 'User disabled' : 'User enabled'); state.reload(); } catch (e) { notify(e.message, 'error'); }
  };

  const columns = [
    { key: 'name', label: 'Name' }, { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (r) => ROLES.find((x) => x.value === r.role)?.label || r.role },
    { key: 'designation', label: 'Designation' },
    { key: 'isActive', label: 'Status', render: (r) => <Badge value={r.isActive ? 'Active' : 'Inactive'} /> },
    { key: 'actions', label: 'Actions', render: (r) => (r._id === user._id ? '-' : <button type="button" className="btn btn-secondary btn-sm" onClick={() => toggle(r)}>{r.isActive ? 'Disable' : 'Enable'}</button>) },
  ];

  return (
    <section className="card">
      <div className="card-head">
        <h2>User management</h2>
        <button type="button" className="btn btn-green btn-sm" onClick={() => setAdding(true)}><UserPlus size={15} /> Add user</button>
      </div>
      <AsyncView state={state} isEmpty={rows.length === 0}><DataTable columns={columns} rows={rows} /></AsyncView>
      {adding && <FormModal title="Add user" fields={USER_FIELDS} onSubmit={create} onClose={() => setAdding(false)} />}
    </section>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  return (
    <>
      <PageHeader title="Settings" subtitle="Your account and portal administration" />
      <div className="grid">
        <div className="grid grid-2"><ProfileForm /><PasswordForm /></div>
        {user.role === 'admin' && <UserAdmin />}
      </div>
    </>
  );
}
