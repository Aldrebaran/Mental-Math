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
    <div className="min-h-screen bg-[#B2A4D4] p-4 pt-28 md:pt-12 md:p-8 font-sans w-full">
        <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] overflow-hidden border-4 border-black">
            
            {/* HEADER AREA */}
            <div className="p-8 md:p-10 border-b-4 border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gray-50/50">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-gray-800 uppercase tracking-tighter">RIWAYAT NILAI</h1>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                        {role === "GURU" ? "• Data hasil pengerjaan kuis seluruh siswa" : "• Pantau progres belajar dan skormu"}
                    </p>
                </div>

                {role === "GURU" && (
                    <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
                        {/* INPUT PENCARIAN NAMA */}
                        <div className="flex flex-col gap-2 w-full md:w-64">
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Cari Siswa</label>
                            <div className="bg-white border-4 border-black rounded-2xl flex items-center px-3 py-1.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <input
                                    type="text"
                                    placeholder="NAMA SISWA..."
                                    className="w-full text-xs font-black outline-none bg-transparent uppercase"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            </div>
                        </div>

                        {/* FILTER PAKET KUIS */}
                        <div className="flex flex-col gap-2 w-full md:w-64">
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Filter Paket Kuis</label>
                            <select
                                className="bg-white border-4 border-black text-gray-700 py-2 px-4 rounded-2xl outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-xs font-black uppercase cursor-pointer h-11.5"
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

            {/* TABLE AREA */}
            <div className="overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                    <div className="max-h-[60vh] overflow-y-auto mt-2">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="sticky top-0 z-10 bg-white border-b-4 border-black">
                                <tr className="text-black text-[11px] font-black uppercase tracking-wider text-left">
                                    <th className="px-8 py-6">Paket Kuis</th>
                                    {role === "GURU" && <th className="px-8 py-6">Siswa</th>}
                                    <th className="px-8 py-6">Skor</th>
                                    <th className="px-8 py-6">Kecepatan</th>
                                    <th className="px-8 py-6">Tanggal</th>
                                    <th className="px-8 py-6 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {dataFiltered.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="text-xs font-black text-gray-800 uppercase">{item.JUDUL_KUIS || "Kuis Tanpa Judul"}</div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{item.ID_KUIS}</div>
                                        </td>
                                        {role === "GURU" && (
                                            <td className="px-8 py-5">
                                                <div className="text-sm font-black text-gray-800 uppercase tracking-tighter">{item.NAMA_SISWA}</div>
                                            </td>
                                        )}
                                        <td className="px-8 py-5">
                                            <span className={`inline-block px-3 py-1 rounded-lg border-2 border-black text-sm font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-white ${item.SKOR >= 70 ? 'bg-green-500' : 'bg-yellow-500'}`}>
                                                {item.SKOR}
                                            </span>
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