import React, { useState, useEffect } from "react";
import { db, auth } from "../lib/Firebase";
import { collection, query, where, getDocs, doc, getDoc, orderBy } from "firebase/firestore";

const RiwayatNilai = () => {
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [semuaHasil, setSemuaHasil] = useState([]);
    const [filterKuis, setFilterKuis] = useState("Semua");
    const [daftarKuis, setDaftarKuis] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

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

    const dataFiltered = semuaHasil.filter(h => {
    const matchesKuis = filterKuis === "Semua" || h.ID_KUIS === filterKuis;
    
    const matchesSearch = h.NAMA_SISWA?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesKuis && matchesSearch;
    });

    if (loading) return <div className="flex justify-center items-center h-screen font-bold text-white uppercase tracking-widest">Memuat Data...</div>;

    return (
    <div className="min-h-screen bg-[#B2A4D4] p-4 pt-24 md:pt-10 md:p-8 font-sans w-full">
        {/* Container Putih Minimalis - Tanpa Border Hitam */}
        <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-sm overflow-hidden">
            
            {/* Header Clean & Spaced */}
            <div className="p-8 md:p-10 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">RIWAYAT NILAI</h1>
                    <p className="text-gray-400 text-xs mt-1 font-medium">
                        {role === "GURU" ? "Data hasil pengerjaan kuis seluruh siswa." : "Pantau progres belajar dan skormu di sini."}
                    </p>
                </div>

                {role === "GURU" && (
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Input Cari Siswa Minimalis */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Cari Nama Siswa</label>
                            <div className="bg-gray-50 border border-gray-200 rounded-xl flex items-center px-3 py-2 w-full md:w-56 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                <input
                                    type="text"
                                    placeholder="Ketik nama..."
                                    className="w-full text-sm font-medium outline-none bg-transparent text-gray-700"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Filter Kuis Minimalis */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Filter Kuis</label>
                            <select
                                className="bg-gray-50 border border-gray-200 text-gray-700 py-2 px-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium w-full md:w-56 appearance-none cursor-pointer"
                                value={filterKuis}
                                onChange={(e) => setFilterKuis(e.target.value)}
                            >
                                <option value="Semua">Semua Kuis</option>
                                {daftarKuis.map(k => (
                                    <option key={k.id} value={k.id}>{k.JUDUL_KUIS}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Table Area Minimalis */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50/50">
                        <tr className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                            <th className="px-8 py-5">Paket Kuis</th>
                            {role === "GURU" && <th className="px-8 py-5">Siswa</th>}
                            <th className="px-8 py-5">Skor</th>
                            <th className="px-8 py-5">Kecepatan</th>
                            <th className="px-8 py-5">Tanggal</th>
                            <th className="px-8 py-5 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {dataFiltered.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                <td className="px-8 py-6">
                                    <p className="font-semibold text-gray-800 text-sm">{daftarKuis.find(k => k.id === item.ID_KUIS)?.JUDUL_KUIS || "Kuis"}</p>
                                    <p className="text-[10px] text-gray-400">ID: {item.ID_KUIS?.substring(0,8)}</p>
                                </td>
                                {role === "GURU" && (
                                    <td className="px-8 py-6">
                                        <p className="font-semibold text-gray-800 text-sm">{item.NAMA_SISWA}</p>
                                    </td>
                                )}
                                <td className="px-8 py-6">
                                    <span className={`text-lg font-bold ${item.SKOR_AKHIR >= 70 ? 'text-green-500' : 'text-orange-500'}`}>
                                        {item.SKOR_AKHIR}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-sm font-medium text-gray-600">{item.DURASI_KERJA_TAMPILAN}</td>
                                <td className="px-8 py-6 text-sm text-gray-500">
                                    {item.WAKTU_SUBMIT?.toDate().toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-500 border border-blue-100 uppercase">
                                        {item.STATUS || "SELESAI"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {dataFiltered.length === 0 && (
                    <div className="py-20 text-center text-gray-300 font-medium text-sm uppercase italic">Data tidak ditemukan</div>
                )}
            </div>

            <div className="bg-gray-50/50 p-6 text-center border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Total: {dataFiltered.length} Record
                </p>
            </div>
        </div>
    </div>
    );
};

export default RiwayatNilai;