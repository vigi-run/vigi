import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Building2, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/auth";

export const BackofficeLayout = () => {
    const { user, clearTokens, clearUser } = useAuthStore();

    const handleLogout = () => {
        clearTokens();
        clearUser();
        window.location.href = "/login";
    };

    return (
        <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950">
            <aside className="w-64 border-r bg-white dark:bg-slate-900 dark:border-slate-800">
                <div className="flex h-16 items-center border-b px-6 dark:border-slate-800">
                    <span className="text-lg font-bold">Vigi Backoffice</span>
                </div>
                <nav className="flex flex-col space-y-1 p-4">
                    <NavLink
                        to="/backoffice"
                        end
                        className={({ isActive }) =>
                            `flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive
                                ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                            }`
                        }
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Dashboard</span>
                    </NavLink>
                    <NavLink
                        to="/backoffice/users"
                        className={({ isActive }) =>
                            `flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive
                                ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                            }`
                        }
                    >
                        <Users className="h-4 w-4" />
                        <span>Users</span>
                    </NavLink>
                    <NavLink
                        to="/backoffice/organizations"
                        className={({ isActive }) =>
                            `flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive
                                ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                            }`
                        }
                    >
                        <Building2 className="h-4 w-4" />
                        <span>Organizations</span>
                    </NavLink>
                </nav>
                <div className="absolute bottom-4 left-4 right-4">
                    <div className="mb-4 px-3 py-2">
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-slate-500">{user?.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                    </button>
                    <a href="/" className="mt-2 block text-center text-xs text-slate-500 hover:underline">
                        Go to App
                    </a>
                </div>
            </aside>
            <main className="flex-1 overflow-auto p-8">
                <div className="mx-auto max-w-6xl">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
