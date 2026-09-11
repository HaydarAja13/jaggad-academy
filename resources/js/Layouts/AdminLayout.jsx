import { useState } from 'react';
import AdminSidebar from '../Components/AdminSidebar';
import CartSync from '../Components/CartSync';
import '../Pages/Admin/Admin.css';

export default function AdminLayout({ children }) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className={`admin-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <CartSync />
            <AdminSidebar 
                isCollapsed={isSidebarCollapsed} 
                toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
            />
            <div className="admin-content">
                {children}
            </div>
        </div>
    );
}
