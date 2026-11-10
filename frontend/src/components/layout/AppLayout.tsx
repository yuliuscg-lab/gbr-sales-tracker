import { NavLink, Outlet, useNavigate } from "react-router"
import {
    LayoutDashboard,
    ShoppingCart,
    Users,
    Package,
    CreditCard,
    Menu,
    LogOut,
    X,
    ChevronDown,
    Tag,
    Receipt,
    Factory
} from 'lucide-react';
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/api/auth";
import logoGbr from "../../assets/logo-gbr.png";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";


const NAV_ITEMS = [
    { label: 'Dashboard', path: '/dashboard/summary', icon: LayoutDashboard },
    { label: 'Orders', path: '/orders', icon: ShoppingCart },
    { label: 'Production', path: '/production', icon: Factory},
    { label: 'Payments', path: '/payments', icon: CreditCard },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Products', path: '/products', icon: Package },
    { label: 'Prices', path: '/prices', icon: Tag },
    { label: 'Expenses', path: '/expenses', icon: Receipt },

]

export const AppLayout: React.FC = () => {
    
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const handleLogout = async() => {
        try {
            await authApi.logout();
        } catch {
            // ignore error
        } finally {
            logout();
            navigate('/login', { replace: true });
        }
    };

    const handleMenuClick = () => {
    // Hanya query yang sedang aktif/tampil di halaman saat itu yang akan di-fetch ulang
        queryClient.invalidateQueries({ refetchType: 'active' });
        setSidebarOpen(false);
    };

    return (
        <div className="flex h-screen bg-slate-100 text-slate-900">
            {sidebarOpen && (
                <div
                className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
                onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6">
                <div className="flex items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg">
                        <img 
                            src={logoGbr} 
                            alt="Logo Gembira" 
                            className="h-full w-full object-contain" 
                        />
                    </div>
                    <div>
                        <h1 className="text-sm md:text-md font-bold tracking-wide text-slate-800">GBR Fishing</h1>
                        <p className="text-[10px] md:text-[12px] text-slate-600 font-medium leading-none">Sales Tracking System</p>
                    </div>
                </div>
                <button
                    type="button"
                    className="rounded-lg py-1.5 pl-3 text-slate-500 hover:bg-slate-100 lg:hidden hover:cursor-pointer"
                    onClick={() => setSidebarOpen(false)}
                >
                    <X size={20} />
                </button>
                </div>
                <nav className="flex-1 space-y-1.5 px-3 py-4">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={handleMenuClick}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${isActive
                                        ? 'bg-blue-100 text-slate-800 font-semibold'
                                        : 'text-slate-600 hover:bg-blue-200 hover:text-slate-900'
                                    }`
                                }>
                                <Icon size={18} className="shrink-0" />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>

        {/* User Footer Profile & Logout */}
                <div className="border-t text-[11px] text-slate-600 border-slate-200 p-4">
                    <p>© 2026 GBR Fishing. All rights reserved.</p>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top Navbar */}
                <header className="flex h-16 items-center justify-between border-b lg:justify-end border-slate-200 bg-white px-4 sm:px-6">
                    <button
                        type="button"
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden hover:cursor-pointer"
                        onClick={() => setSidebarOpen(true)}>
                        <Menu size={22} />
                    </button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-3 py-2 px-4 rounded-lg hover:cursor-pointer">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-[14                                                                                                     px] font-bold text-slate-700">
                                    {user?.name?.[0]?.toUpperCase()}
                                </div>
                                <div className="hidden md:flex truncate">
                                    <p className="truncate text-sm font-semibold text-slate-800">{user?.name.toUpperCase()}</p>
                                </div>
                                <ChevronDown size={18}/>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>
                                    <p className="text-sm font-semibold">Hi, {user?.name}!</p>
                                </DropdownMenuLabel>
                            </DropdownMenuGroup>
                            <DropdownMenuGroup>
                                <DropdownMenuItem className="flex items-center gap-3 hover:cursor-pointer text-rose-600" onClick={handleLogout}>
                                        <LogOut size={16} />
                                        <p className="text-sm font-medium">Log Out</p>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>

                {/* Scrollable Viewport */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="mx-auto max-w-7xl">
                        <Outlet/>
                    </div>
                </main>
            </div>
        </div>
    );
};