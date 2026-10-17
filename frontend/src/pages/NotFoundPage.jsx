import { Link } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader.jsx';

export default function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page not found" subtitle="The page you requested does not exist." />
      <Link className="btn" to="/dashboard">Go to dashboard</Link>
    </>
  );
}
