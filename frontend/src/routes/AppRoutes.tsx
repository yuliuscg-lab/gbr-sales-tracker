import { BrowserRouter, Route, Routes } from "react-router"
import { RegisterPage } from "../pages/Register"
import { LoginPage } from "@/pages/Login/Login"
import { CustomerLayout } from "@/components/layout/CustomerLayout"
import { Home } from "@/pages/customer/Home/Home"
import { EventDetails } from "@/pages/customer/Home/EventDetails"
import { MyOrders } from "@/pages/customer/My Orders/MyOrders"
import { OrderDetails } from "@/pages/customer/My Orders/OrderDetails"
import { PublicOnlyRoute } from "./PublicOnlyRoute"
import { ProtectedRoute } from "./ProtectedRoute"
import { PortalLayout } from "@/components/layout/PortalLayout"
import { Dashboard } from "@/pages/organizer/Dashboard"
import { Events } from "@/pages/organizer/Events"
import { CreateEvent } from "@/pages/organizer/CreateEvent"
import { Tickets } from "@/pages/organizer/Tickets"
import { Sales } from "@/pages/organizer/Sales"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { AdminDashboard } from "@/pages/admin/AdminDashboard"

export const AppRoutes: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<PublicOnlyRoute/>}>
                    <Route path="/login" element={<LoginPage/>}/>
                    <Route path="/register" element = {<RegisterPage/>}/>
                </Route>
                <Route element={<CustomerLayout/>}>
                    <Route path="/" element={<Home/>}/>
                    <Route path="/events/:id" element={<EventDetails/>}/>
                    <Route path="/orders" element={<MyOrders/>}/>
                    <Route path="/orders/:id" element={<OrderDetails/>}/>
                </Route>

                <Route element={<ProtectedRoute allowedRoles={["ORGANIZER"]}/>}>
                    <Route path="/organizer/portal" element={<PortalLayout children={<Dashboard/>}/>}/>
                    <Route path="/organizer/events" element={<PortalLayout children={<Events/>}/>}/>
                    <Route path="/organizer/events/create" element={<PortalLayout children={<CreateEvent/>}/>}/>
                    <Route path="/organizer/tickets" element={<PortalLayout children={<Tickets/>}/>}/>
                    <Route path="/organizer/sales" element={<PortalLayout children={<Sales/>}/>}/>
                </Route>

                <Route element={<ProtectedRoute allowedRoles={["ADMIN"]}/>}>
                    <Route path="/admin/portal" element={<AdminLayout children={<AdminDashboard/>}/>}/>
                </Route>
            </Routes>
        </BrowserRouter>
    )
}