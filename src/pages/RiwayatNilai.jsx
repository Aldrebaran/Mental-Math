import React, { useState, useEffect } from "react";
import { db, auth } from "../lib/Firebase";
import { collection, query, where, getDocs, doc, getDoc, orderBy } from "firebase/firestore";

const RiwayatNilai = () => {
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [semuaHasil, setSemuaHasil] = useState([]);
    const [filterKuis, setFilterKuis] = useState("Semua");
    const [daftarKuis, setDaftarKuis] = useState([]);

    useEffect(() => {
        const checkRoleAndFetchData = async () => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                const guruDoc = await getDoc(doc(db, "GURU", user.uid));
                let userRole = "SISWA";
                if (guruDoc.exists()) {
                    userRole = "GURU";
                }
                setRole(userRole);

                const kuisSnap = await getDocs(collection(db, "KUIS"));
                setDaftarKuis(kuisSnap.docs.map(d => ({id: d.id, ...d.data() })));

                let q;
                if (userRole === "GURU") {
                    q = query(collection(db,"HASIL_KUIS"), orderBy("WAKTU_SUBMIT", "desc"));
                } else {
                    q = query(collection(db,"HASIL_KUIS"), where("ID_SISWA", "==", user.uid), orderBy("WAKTU_SUBMIT", "desc"));
                }

                const querySnapshot = await getDocs(q);
                setSemuaHasil(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        checkRoleAndFetchData();
    }, []);

    const dataFiltered = filterKuis === "Semua" 
        ? semuaHasil 
        : semuaHasil.filter(h => h.ID_KUIS === filterKuis);

    if (loading) return <div className="flex justify-center items-center h-screen font-bold text-white uppercase tracking-widest">Memuat Data...</div>;

    return (
        <div className="min-h-screen bg-[#B2A4D4] p-4 pt-20 md:pt-8 md:p-8 font-sans w-full">
            <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-lg overflow-hidden">
                
                <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-800 uppercase tracking-tight">RIWAYAT NILAI</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {role === "GURU" ? "Data hasil pengerjaan kuis seluruh siswa." : "Pantau progres belajar dan skormu di sini."}
                        </p>
                    </div>

                    {role === "GURU" && (
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Filter Paket Kuis</label>
                            <select
                                className="bg-gray-50 border-2 border-gray-100 text-gray-700 py-2 px-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm font-bold"
                                value={filterKuis}
                                onChange={(e) => setFilterKuis(e.target.value)}
                            >
                                <option value="Semua">Semua Kuis</option>
                                {daftarKuis.map(k => (
                                    <option key={k.id} value={k.id}>{k.JUDUL_KUIS}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="p-4 md:p-0">
                    
                    <div className="block md:hidden space-y-4 max-h-125 overflow-y-auto p-1">
                        {dataFiltered.length > 0 ? dataFiltered.map((item) => (
                            <div key={item.id} className="bg-gray-50 p-5 rounded-2xl border border-gray-200 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="max-w-[70%]">
                                        <p className="text-[10px] font-black text-orange-500 uppercase mb-1">Paket Kuis</p>
                                        <p className="font-bold text-gray-800 mb-2">
                                            {daftarKuis.find(k => k.id === item.ID_KUIS)?.JUDUL_KUIS || "Memuat..."}
                                        </p>
                                        
                                        <p className="text-[10px] font-black text-blue-500 uppercase mb-1">Nama Siswa</p>
                                        <p className="font-bold text-gray-800 wrap-break-words">{item.NAMA_SISWA}</p>

                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Skor</p>
                                        <p className={`text-2xl font-black ${item.SKOR_AKHIR >= 80 ? 'text-green-600' : 'text-orange-500'}`}>{item.SKOR_AKHIR}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-200">
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase italic">Kecepatan</p>
                                        <p className="text-sm font-bold text-gray-700">{item.DURASI_KERJA_TAMPILAN || "00:00"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase italic">Tanggal</p>
                                        <p className="text-sm font-bold text-gray-700">
                                            {item.WAKTU_SUBMIT?.toDate().toLocaleDateString("id-ID", { day: '2-digit', month: 'short' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-2 pt-3 border-t border-gray-200">
                                    <span className="block text-center py-2 rounded-lg text-[10px] font-black bg-blue-100 text-blue-700 uppercase">
                                        {item.STATUS || "SELESAI"}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div className="py-20 text-center opacity-30 font-black uppercase text-xs">Belum ada data</div>
                        )}
                    </div>

                    <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-137.5 scrollbar-thin">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-100">
                                <tr className="text-gray-500 text-[11px] font-black uppercase tracking-wider">
                                    <th className="px-8 py-5">Paket Kuis</th>
                                    {role === "GURU" && <th className="px-8 py-5">Siswa</th>}
                                    <th className="px-8 py-5">Skor</th>
                                    <th className="px-8 py-5">Kecepatan</th>
                                    <th className="px-8 py-5">Tanggal</th>
                                    <th className="px-8 py-5 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {dataFiltered.map((item) => (
                                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-8 py-5">
                                            <p className="font-bold text-gray-800 text-sm">
                                                {daftarKuis.find(k => k.id === item.ID_KUIS)?.JUDUL_KUIS || "Nama Tidak Ditemukan"}
                                            </p>
                                            <p className="text-[9px] text-gray-400">ID: {item.ID_KUIS?.substring(0,6)}</p>
                                        </td>

                                        {role === "GURU" && (
                                            <td className="px-8 py-5">
                                                <p className="font-bold text-gray-800 text-sm">{item.NAMA_SISWA}</p>
                                                <p className="text-[9px] text-gray-400">ID: {item.ID_SISWA?.substring(0,8)}</p>
                                            </td>
                                        )}
                                        <td className="px-8 py-5">
                                            <span className={`text-xl font-black ${item.SKOR_AKHIR >= 80 ? 'text-green-600' : 'text-orange-500'}`}>{item.SKOR_AKHIR}</span>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-bold text-gray-600">{item.DURASI_KERJA_TAMPILAN}</td>
                                        <td className="px-8 py-5 text-sm text-gray-500">
                                            {item.WAKTU_SUBMIT?.toDate().toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' })}
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="px-3 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-100 uppercase">
                                                {item.STATUS || "SELESAI"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Total: {dataFiltered.length} Record Terdeteksi
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RiwayatNilai;