import React, {useState} from "react";
import { auth } from "../lib/Firebase"; 
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const Sidebar = ({ role, isOpen, toggleSidebar }) => {
    const navigate = useNavigate();
    const [showConfirm, setShowConfirm] = useState(false);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/login");
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    return (
        <>
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#d9d9d9] flex flex-col h-screen border-r border-gray-400 rounded-r-[30px] shadow-2xl transform ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
            
            <div className="p-8">

                <button onClick={toggleSidebar}
                    className="lg:hidden absolute right-4 top-4 text-purple-700 font-bold">
                    ✕
                </button>
                
                <h1 className="text-2xl font-black bold tracking-tighter text-center text-purple-700">
                    MENTAL MATH     
                </h1>
                <div className="mt-4 border-b border-gray-400 opacity-50">                  
                </div>
            </div>

            <nav className="flex-1 flex flex-col">
                <Link
                    to={role === "GURU" ? "/DashboardGuru" : "/DashboardSiswa"}
                    className="w-full text-left px-6 py-4 border-b border-gray-400 font-bold text-gray-700 hover:bg-gray-300 transition-all flex items-center gap-2"
                >
                    BERANDA
                </Link>

                {role === 'GURU' ? (
                    <>
                        <Link
                            to="/manajemen-siswa"
                            className="w-full text-left px-6 py-4 border-b border-gray-400 font-bold text-gray-600 hover:bg-gray-300 transition-all"
                        >
                            MANAJEMEN DATA SISWA
                        </Link>
                        <Link
                            to="/bank-soal"
                            className="w-full text-left px-6 py-4 border-b border-gray-400 font-bold text-gray-600 hover:bg-gray-300"
                        >
                            BANK SOAL
                        </Link>
                        <Link
                            to="/kelola-kuis"
                            className="w-full text-left px-6 py-4 border-b border-gray-400 font-bold text-gray-600 hover:bg-gray-300 transition-all"
                        >
                            KELOLA KUIS
                        </Link>
                        <Link
                            to="/riwayat-nilai-guru"
                            className="w-full text-left px-6 py-4 border-b border-gray-400 font-bold text-gray-600 hover:bg-gray-300 transition-all"
                        >
                            RIWAYAT NILAI
                        </Link>
                    </>
                ) : (
                    <>
                        <Link
                            to="/kuis-berlangsung" 
                            className="w-full text-left px-6 py-4 border-b border-gray-400 font-bold text-gray-600 hover:bg-gray-300"> 
                            KUIS BERLANGSUNG
                        </Link>
                        <Link
                            to="/riwayat-nilai-siswa"
                            className="w-full text-left px-6 py-4 border-b border-gray-400 font-bold text-gray-600 hover:bg-gray-300"
                        >
                            RIWAYAT NILAI
                        </Link>
                    </>
                )}
            </nav>

                <div className="p-4 mt-auto flex justify-center">
                    <button
                    onClick={() => setShowConfirm(true)}
                    className="flex items-center justify-center gap-2 bg-[#e63946] hover:bg-red-700 text-white font-black py-1.5 px-4 rounded-full transition-all shadow-md active:scale-95 border-2 border-white/20">
                    
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    <span className="text-xs uppercase tracking-wider">Logout</span>
                    </button>
                </div>
        </aside>

        {showConfirm && (
            <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
                <div className="bg-[#B2A4D4] p-8 rounded-[35px] shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] w-full max-w-xs text-center border-4 border-black relative">
                    <h3 className="text-2xl font-black text-black mb-8 leading-none uppercase tracking-tighter">
                    APA ANDA YAKIN <br /> INGIN KELUAR?
                    </h3>

                    <div className="flex flex-col gap-4">
                         <button
                            onClick={() => setShowConfirm(false)}
                            className="w-full py-4 bg-[#E74C3C] text-white border-4 border-black font-black rounded-2xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all uppercase text-sm tracking-widest">
                            Tidak
                         </button>
                         <button
                            onClick={handleLogout}
                            className="w-full py-4 bg-[#2ECC71] text-white border-4 border-black font-black rounded-2xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all uppercase text-sm tracking-widest">
                            Ya
                         </button>
                    </div>
                </div>    
            </div>
        )}
    </>
    );
};

export default Sidebar;