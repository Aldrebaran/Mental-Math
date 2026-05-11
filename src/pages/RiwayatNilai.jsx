import React, { useState, useEffect } from "react";
import { db, auth } from "../lib/Firebase";
import { collection, query, where, getDocs, doc, getDoc, orderBy } from "firebase/firestore";

const RiwayatNilai = () => {
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [semuaHasil, setSemuaHasil] = useState([]);
    const [filterKuis, setFilterKuis] = useState("Semua");
    const [searchTerm, setSearchTerm] = useState(""); // Tambahan untuk fitur pencarian
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

    // Logika Filter Gabungan (Pencarian Nama + Filter Kuis)
    const dataFiltered = semuaHasil.filter(h => {
        const matchesKuis = filterKuis === "Semua" || h.ID_KUIS === filterKuis;
        const matchesSearch = h.NAMA_SISWA?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesKuis && matchesSearch;
    });

    if (loading) return <div className="flex justify-center items-center h-screen font-bold text-white uppercase tracking-widest">Memuat Data...</div>;

    return (
        /* PERBAIKAN UTAMA: pt-24 memastikan konten tidak tertutup navbar atas, pb-20 agar tidak mepet bawah */
        <div className="min-h-screen bg-[#B2A4D4] p-4 pt-24 pb-20 md:pt-12 md:pb-12 md:p-8 font-sans w-full">
            <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-lg overflow-hidden">
                
                {/* Header Asli Minimalis */}
                <div className="p-8 md:p-10 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-800 uppercase tracking-tight">RIWAYAT NILAI</h1>
                        <p className="text-gray-500 text-sm mt-1 font-medium">
                            {role === "GURU" ? "Data hasil pengerjaan kuis seluruh siswa." : "Pantau progres belajar dan skormu di sini."}
                        </p>
                    </div>

                    {role === "GURU" && (
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Input Pencarian Nama Siswa */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Cari Siswa</label>
                                <input
                                    type="text"
                                    placeholder="Nama siswa..."
                                    className="bg-gray-50 border-2 border-gray-100 text-gray-700 py-2 px-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm font-bold"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Filter Paket Kuis */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Filter Kuis</label>
                                <select
                                    className="bg-gray-50 border-2 border-gray-100 text-gray-700 py-2 px-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm font-bold cursor-pointer"
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

                <div className="p-4 md:p-0">
                    <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[70vh] scrollbar-thin">
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
                                                <p className="font-bold text-gray-800 text-sm uppercase">{item.NAMA_SISWA}</p>
                                            </td>
                                        )}
                                        <td className="px-8 py-5 text-xl font-black">
                                            <span className={item.SKOR_AKHIR >= 80 ? 'text-green-600' : 'text-orange-500'}>
                                                {item.SKOR_AKHIR}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-bold text-gray-600">{item.DURASI_KERJA_TAMPILAN}</td>
                                        <td className="px-8 py-5 text-sm text-gray-500 font-medium">
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

                <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Total: {dataFiltered.length} Record Terdeteksi
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RiwayatNilai;