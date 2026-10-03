import { Navigate } from 'react-router-dom'
export default function AdminProvidersPage(){return <Navigate to="/admin/users?role=PROVIDER&status=PENDING_APPROVAL" replace />}
