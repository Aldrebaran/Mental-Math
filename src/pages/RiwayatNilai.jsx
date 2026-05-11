import React, { useState, useEffect } from "react";
import { db, auth } from "../lib/Firebase";
import { collection, query, where, getDocs, doc, getDoc, orderBy } from "firebase/firestore";

const RiwayatNilai = () => {
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [semuaHasil, setSemuaHasil] = useState([]);
    const [filterKuis, setFilterKuis] = useState("Semua");
    const [searchTerm, setSearchTerm] = useState(""); // State pencarian nama
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

    // Logika Filter Gabungan (Kuis + Nama Siswa)
    const dataFiltered = semuaHasil.filter(h => {
        const matchesKuis = filterKuis === "Semua" || h.ID_KUIS === filterKuis;
        const matchesSearch = h.NAMA_SISWA?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesKuis && matchesSearch;
    });

    if (loading) return <div className="flex justify-center items-center h-screen font-bold text-white uppercase tracking-widest">Memuat Data...</div>;

    return (
        /* pt-24 di mobile dan pt-12 di desktop agar TIDAK TERPOTONG navbar */
        <div className="min-h-screen bg-[#B2A4D4] p-4 pt-24 md:pt-12 md:p-8 font-sans w-full text-left">
            <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-50">
                
                {/* Header Minimalis */}
                <div className="p-8 md:p-10 border-b border-gray-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">RIWAYAT NILAI</h1>
                        <p className="text-gray-400 text-xs mt-1 font-medium">
                            {role === "GURU" ? "Data hasil pengerjaan kuis seluruh siswa." : "Pantau progres belajar dan skormu di sini."}
                        </p>
                    </div>

                    {role === "GURU" && (
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Input Cari Nama Minimalis */}
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-bold text-gray-300 uppercase ml-1">Cari Siswa</span>
                                <input
                                    type="text"
                                    placeholder="Nama siswa..."
                                    className="bg-gray-50 text-gray-700 py-2 px-4 rounded-xl outline-none border border-transparent focus:border-blue-100 text-sm font-medium w-full md:w-56 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Filter Kuis Minimalis */}
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-bold text-gray-300 uppercase ml-1">Filter Kuis</span>
                                <select
                                    className="bg-gray-50 text-gray-700 py-2 px-4 rounded-xl outline-none border border-transparent focus:border-blue-100 text-sm font-medium w-full md:w-56 cursor-pointer"
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

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-gray-300 text-[11px] font-bold uppercase tracking-wider border-b border-gray-50">
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
                                <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <p className="font-semibold text-gray-700 text-sm">
                                            {daftarKuis.find(k => k.id === item.ID_KUIS)?.JUDUL_KUIS || "Kuis"}
                                        </p>
                                        <p className="text-[10px] text-gray-400">ID: {item.ID_KUIS?.substring(0,6)}</p>
                                    </td>
                                    {role === "GURU" && (
                                        <td className="px-8 py-6">
                                            <p className="font-semibold text-gray-700 text-sm">{item.NAMA_SISWA}</p>
                                        </td>
                                    )}
                                    <td className="px-8 py-6">
                                        <span className={`text-xl font-bold ${item.SKOR_AKHIR >= 70 ? 'text-green-500' : 'text-orange-500'}`}>
                                            {item.SKOR_AKHIR}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-medium text-gray-500">{item.DURASI_KERJA_TAMPILAN}</td>
                                    <td className="px-8 py-6 text-sm text-gray-400">
                                        {item.WAKTU_SUBMIT?.toDate().toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-400 border border-blue-100 uppercase">
                                            {item.STATUS || "SELESAI"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {dataFiltered.length === 0 && (
                        <div className="py-20 text-center text-gray-300 text-sm font-medium uppercase tracking-widest italic">Data tidak ditemukan</div>
                    )}
                </div>

                <div className="bg-gray-50/30 p-6 text-center border-t border-gray-50">
                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                        Total: {dataFiltered.length} Record Terdeteksi
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RiwayatNilai;