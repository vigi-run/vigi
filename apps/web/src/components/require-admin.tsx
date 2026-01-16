import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

export const RequireAdmin = () => {
    const user = useAuthStore((state) => state.user);

    if (!user || user.role !== 'ADMIN') {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};
