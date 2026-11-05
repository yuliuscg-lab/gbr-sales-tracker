import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { ProtectedRoute } from "./ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { CustomersPage } from "@/pages/CustomerPage";
import { PublicOnlyRoute } from "./PublicOnlyRoute";
import { ProductsPage } from "@/pages/ProductPage";
import { PriceMatrixPage } from "@/pages/PriceMatrixPage";
import { OrderFormPage } from "@/pages/OrderFormPage";
import { OrdersPage } from "@/pages/OrdersPage";
import { PaymentsPage } from "@/pages/PaymentPage";
import { ExpensesPage } from "@/pages/ExpensePage";
import { CustomerDetailPage } from "@/pages/CustomerDetailPage";
import { DashboardPage } from "@/pages/DashboardPage";

export const AppRoutes: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/*Public Route*/}
                <Route element={<PublicOnlyRoute/>}>
                    <Route path='/login' element= {<LoginPage />}/>
                </Route>

                {/*Protected Route*/}
                <Route element={<ProtectedRoute/>}>
                    {/*Layout Wrapper with Sidebar & Header*/}
                    <Route element={<AppLayout/>}>
                        <Route path="/" element={<Navigate to="/dashboard/summary" replace />} />
                        <Route path="/orders" element={<OrdersPage/>} />
                        <Route path="/orders/new" element={<OrderFormPage/>} />
                        <Route path="/orders/:id" element={<OrderFormPage/>} />
                        <Route path="/customers" element={<CustomersPage />} />
                        <Route path="/products" element={<ProductsPage />} />
                        <Route path="/prices" element={<PriceMatrixPage/>}/>
                        <Route path="/payments" element={<PaymentsPage/>}/>
                        <Route path="/expenses" element={<ExpensesPage/>}/>
                        <Route path="/customers/:id" element={<CustomerDetailPage />} />
                        <Route path="/dashboard/summary" element={<DashboardPage/>}/>
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to='/dashboard/summary' replace/>}/>   
            </Routes>
        </BrowserRouter>
    );
};