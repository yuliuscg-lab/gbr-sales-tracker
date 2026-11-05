import { useAuthStore } from "@/store/authStore";
import { Navigate, Outlet, useLocation } from "react-router";


export const ProtectedRoute: React.FC = () => {
    const {accessToken, isInitialized} = useAuthStore();
    const location = useLocation();

    if(!isInitialized) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"/>
                    <p className="text-sm font-medium text-slate-500">Checking User Session</p>
                </div>
            </div>
        );
    }

    if(!accessToken) {
        return <Navigate to="/login" state={{ from: location }} replace/>;
    }

    return <Outlet/>
};