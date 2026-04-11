import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

const DashboardLayout = ({ role }) => {
    const [isSidebarOpen, setSideBarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-[#b2a4d4] overflow-hidden">
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSideBarOpen(false)}>
                </div>
            )}

            <Sidebar role={role} isOpen={isSidebarOpen} toggleSidebar = {() => setSideBarOpen(false)} />

            <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
                <header className="lg:hidden p-4 bg-[#d9d9d9] flex items-center shadow-md">
                    <button onClick={() => setSideBarOpen(true)}
                        className="text-purple-700 text-2xl">
                            ☰
                        </button>
                    <span className="ml-4 font-black text-purple-700 bold">
                        MENTAL MATH
                    </span>
                </header>

                <div className="flex-1 flex items-center justify-center p-2 md:p-4 overflow-y-auto md:overflow-hidden">
                    <Outlet/>
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;