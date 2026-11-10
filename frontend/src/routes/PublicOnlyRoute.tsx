import { useAuthStore } from "@/store/authStore";
import { Navigate, Outlet } from "react-router";

export const PublicOnlyRoute: React.FC = () => {
    const { accessToken, isInitialized } = useAuthStore();

    if(!isInitialized) {
        return null;
    }

    if(accessToken) {
        return <Navigate to="/dashboard/summary" replace/>;
    }

    return <Outlet/>;
};