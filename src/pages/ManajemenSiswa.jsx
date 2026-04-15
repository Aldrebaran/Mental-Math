import React, { useState, useEffect, useCallback } from "react";
import { db, auth } from "../lib/Firebase";
import { collection, getDocs, where, addDoc, deleteDoc, doc, updateDoc, query } from "firebase/firestore";
import { Pencil, User, ChevronDown, X, Search, Plus, Trash2, Check} from "lucide-react";

const ManajemenSiswa = ()  =>{

    const [selectedKelas, setSelectedKelas] = useState("");
    const [selectedTahun, setSelectedTahun] = useState("");
    const [newTahun, setNewTahun] = useState("");
    const [daftarKelas, setDaftarKelas] = useState([]);
    const [daftarSiswa, setDaftarSiswa] = useState([]);
    const [loading, setLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("Edit Kelas");
    const [newKelasName, setNewKelasName] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [searchTahun, setSeacrhTahun] = useState("");

    const [selectedKelasIds, setSelectedKelasIds] = useState([]);
    const [selectedTahunIds, setSelectedTahunIds] = useState([]);

    const [editNamaSiswa, setEditNamaSiswa] = useState("");
    const [siswaSedangDiedit, setSiswaSedangDiedit] = useState(null);
    const [filterKelasSiswa, setFilterKelasSiswa] = useState("");

    const [dataSiswaModal, setDataSiswaModal] = useState([]);

    const [selectedSiswaIds, setSelectedSiswaIds] = useState([]);
    const [kelasTujuanPindah, setKelasTujuanPindah] = useState("");
    const [tahunTujuanPindah, setTahunTujuanPindah] = useState("");

    const [selectedHapusKelas, setSelectedHapusKelas] = useState("");
    const [selectedSiswaHapus, setSelectedSiswaHapus] = useState([]);
    const [searchSiswaHapus, setSearchSiswaHapus] = useState("");

    const [listTahunAjaran, setListTahunAjaran] = useState([]);

    const fetchKelas = useCallback (async () => {
        try {
            const querySnapshot = await getDocs(collection(db,"KELAS"));
            const list = querySnapshot.docs.map( d => ({ id: d.id, ...d.data()}));
            const kelasTahunIni = list.filter(k => k.TAHUN_AJARAN === selectedTahun);
            setDaftarKelas(list);

            if (kelasTahunIni.length === 0) {
                setDaftarSiswa([]);
                setSelectedKelas("");
            }
        } catch (err){
            console.error("Gagal mengambil data kelas", err);
        }
    }, [selectedTahun]);

    const fetchTahunAjaran = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "TAHUN_AJARAN"));
            const data = querySnapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            }));
            setListTahunAjaran(data);
        } catch (err) {
            console.error("Error Fetch Tahun:", err);
        }
    };

    const handleTambahTahun = async () => {
    if (!newTahun.trim()) return alert("Masukkan tahun ajaran baru!");

    setLoading(true);
        try {
            await addDoc(collection(db, "TAHUN_AJARAN"), {
                TAHUN: newTahun.toUpperCase().trim()
            });

            setNewTahun("");
            alert("Tahun Ajaran baru berhasil disimpan!");
            await fetchTahunAjaran(); 
        } catch (err) {
            console.error(err);
            alert("Gagal menambah tahun.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTahunAjaran();
    }, []);

    const fetchSiswa = useCallback(async () => {

        if (!selectedKelas) {
            setDaftarSiswa([]);
            return;
        }

        setLoading(true);
        try {

            const q = query(collection(db, "SISWA"), where('ID_KELAS', "==", selectedKelas));
            const snap = await getDocs(q);
            setDaftarSiswa(snap.docs.map(d => ({ id: d.id, ...d.data() })));

        } catch (err) {
            console.error("Error Fetch Siswa:", err);
        } finally {
            setLoading(false);
        }
    }, [selectedKelas]); 

    const fetchDataModal = async () => {
        try {
            const snap = await getDocs(collection(db, "SISWA"));
            setDataSiswaModal(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchKelas();
        fetchSiswa();
        fetchTahunAjaran();
    }, [fetchSiswa, fetchKelas]);

    const handleTambahKelas = async () => {
        if (!newKelasName.trim() || !selectedTahun) return;
        try {

            const guruId = auth.currentUser.uid;

            await addDoc (collection(db, "KELAS"), {
                NAMA_KELAS: newKelasName.toUpperCase(),
                TAHUN_AJARAN: selectedTahun,
                ID_GURU: guruId,
            });
            setNewKelasName("");
            fetchKelas();
        } catch {
            alert("Gagal menambah kelas",);
        }
    };

    const handleProsesHapus = async (id = null) => {
        const targetIds = id ? [id] : selectedKelasIds;
        
        if (targetIds.length === 0) return;

        const pesan = targetIds.length === 1
            ? "Hapus kelas ini?"
            : `Hapus ${targetIds.length} kelas yang dipilih?`;

        if(window.confirm(pesan)) {
            try {
                await Promise.all(
                    targetIds.map(targetId => deleteDoc(doc(db, "KELAS", targetId)))
                );

                if (!id) setSelectedKelasIds([]);

                fetchKelas();
            } catch (err) {
                console.error(err);
                alert("Gagal menghapus data");
            }
        }
    };

    const handleBulkDeleteTahun = async () => {
        if (selectedTahunIds. length === 0) return;

        const confirmDelete = window.confirm(`Hapus data untuk ${selectedTahunIds.length} tahun ajaran terpilih? `);
        if (!confirmDelete) return;

        try {
            for (const tahun of selectedTahunIds) {

                await deleteDoc(doc(db, "TAHUN_AJARAN", tahun));

                const kelasSesuaiTahun = daftarKelas.filter(k => k.TAHUN_AJARAN === tahun);
                for (const k of kelasSesuaiTahun) {
                    await deleteDoc(doc(db, "KELAS", k.id));
                }
            }

            await fetchTahunAjaran();
            setSelectedTahunIds([]);
            fetchKelas();
            alert("Data Tahun Ajaran berhasil dihapus!");
        } catch (err){
            console.error("Error hapus tahun:", err);
            alert("Gagal menghapus beberapa data.");
        }
    }

    const handleSimpanNamaSiswa = async (id) => {
        if (!editNamaSiswa.trim()) return;
        try {
            await updateDoc(doc(db, "SISWA", id), { NAMA_SISWA: editNamaSiswa.toUpperCase() });
            await fetchSiswa();
            await fetchDataModal();
            setSiswaSedangDiedit(null);
            setEditNamaSiswa("");
        } catch (err) { console.error(err); }
    };

    const handleBulkPindah = async () => {
        if (!kelasTujuanPindah) return alert("Pilih kelas tujuan!");
        if (!tahunTujuanPindah) return alert("Pilih tahun ajaran tujuan!")
        if (selectedSiswaIds.length === 0) return alert("Pilih siswa terlebih dahulu!");

        const infoKelas = daftarKelas.find(k=> k.id === kelasTujuanPindah);
        const namaKelasDisplay = infoKelas ? infoKelas.NAMA_KELAS : kelasTujuanPindah;

        const confirm = window.confirm(`Pindahkan ${selectedSiswaIds.length} Siswa ke kelas ${namaKelasDisplay} (${tahunTujuanPindah})?`);
        if (!confirm) return;

        try {
            await Promise.all(
                selectedSiswaIds.map(id => updateDoc(doc(db, "SISWA", id), { ID_KELAS: kelasTujuanPindah, TAHUN_AJARAN: tahunTujuanPindah }))
            );

            await fetchSiswa();
            await fetchDataModal();
            setSelectedSiswaIds([]);
            alert("Berhasil memindahkan siswa!");
        } catch (err) { console.error(err); }
    };

    const toggleSelect = (id) => {
        setSelectedKelasIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectTahun = (tahun) => {
        setSelectedTahunIds((prev) => 
           prev.includes(tahun)
                ? prev.filter((t) => t !== tahun)
                : [...prev, tahun]
        );
    };

    const handleBulkHapusSiswa = async () =>{
        if (selectedSiswaHapus.length === 0) return;

        const konfirmasi = window.confirm(`Keluarkan ${selectedSiswaHapus.length} siswa dari kelas?`);
        if (!konfirmasi) return;

        setLoading(true);

        try {
            const promises = selectedSiswaHapus.map(id =>
                updateDoc(doc(db, "SISWA", id), {
                    KELAS: "",
                    TAHUN_AJARAN: ""
                })
            );
            
            await Promise.all(promises);

            await fetchSiswa();
            await fetchDataModal();

            setSelectedSiswaHapus([]);
            alert("Siswa berhasil dikeluarkan");
        } catch (err) {
            console.error("Error Hapus:", err);
            alert("Terjadi kesalahan saat menghapus data.");
        } finally {
            setLoading(false);
        }
    };

    const toggleSelectAllSiswaHapus = () => {
        const filteredSiswa = dataSiswaModal.filter(s =>
            s.KELAS === selectedHapusKelas && 
            (s.NAMA_SISWA || "").toString().toLowerCase().includes((searchSiswaHapus || "").toString().toLowerCase())
        );

        if (selectedSiswaHapus.length === filteredSiswa.length && filteredSiswa.length > 0) {
            setSelectedSiswaHapus([]);
        } else {
            setSelectedSiswaHapus(filteredSiswa.map(s => s.id));
        }
    };
    
            
    return (
        <div className="flex flex-col items-center w-full p-4 md:p-8 space-y-8 pt-20 md:pt-8">
            <h1 className="text-lg md:text-2xl font-black text-black tracking-tight uppercase text-center leading-tight px-2">
                MANAJEMEN SISWA {selectedKelas ? ` - KELAS ${daftarKelas.find(k => k.id === selectedKelas)?.NAMA_KELAS || ""}` : ""}
            </h1>

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-start justify-center w-full max-w-6xl">

                <div className="w-full max-w-87.5 md:max-w-sm bg-[#B4A7A7] rounded-[30px] overflow-hidden shadow-2xl border-2 border-black/10">
                    <div className="bg-[#93C5FD] p-4 flex justify-between items-center border-b-2 border-black/10">
                        <span className="font-bold text-xs md:text-sm uppercase tracking-widest text-black">Siswa</span>
                        <div className="relative">
                            <select 
                                className="bg-white border-2 border-black/20 rounded-xl px-2 md:px-4 py-1.5 text-[10px] md:text-xs font-bold appearance-none pr-8 outline-none cursor-pointer"
                                value={selectedKelas}
                                onChange={(e) => setSelectedKelas(e.target.value)}
                            >
                                <option value="">Semua Kelas</option>
                                {daftarKelas.map (k => (
                                    <option key={k.id} value={k.id}>{k.NAMA_KELAS}</option>
                                ))}
                            </select>
                            <ChevronDown size={12} className="absolute right-2 top-2.5 pointer-events-none text-gray-500"/>
                        </div>
                    </div>

                    <div className="divide-y-2 divide-black/5 min-h-62.5 md:min-h-75 bg-[#C4B7B7] flex flex-col">
                        {loading ? (
                            <div className="m-auto font-bold animate-pulse text-blue-600 uppercase text-xs">Mengambil Data...</div>
                        ) : daftarSiswa.length > 0 ? (
                            daftarSiswa.map((siswa) => (
                                <div key={siswa.id} className="flex justify-between items-center p-4 hover:bg-black/5">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-black/80 rounded-full p-1 text-white">
                                            <User size={16}/>
                                        </div>
                                        <span className="font-black text-[10px] md:text-sm text-gray-800 uppercase">
                                            {siswa.NAMA_SISWA}
                                        </span>
                                    </div>

                                    <span className="font-black text-[9px] md:text-xs text-gray-600 uppercase">
                                        {daftarKelas.find(k => k.id === siswa.ID_KELAS)?.NAMA_KELAS || "Tanpa Kelas"}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="m-auto text-[10px] md:text-xs font-black text-gray-500 italic uppercase tracking-widest text-center px-4">
                                {selectedKelas ? "Belum ada siswa" : "Pilih kelas dahulu"}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-center gap-6 w-full max-w-75">
                    <div className="bg-[#93C5FD] p-4 md:p-5 rounded-[25px] shadow-xl border-2 border-black/10 flex items-center gap-4 md:gap-6 w-full justify-center">
                        <div>
                            <p className="text-[9px] md:text-[10px] font-black mb-1 uppercase text-black/70 tracking-widest text-center">Tahun Ajaran</p>
                            <select
                                className="bg-white rounded-xl px-3 py-1.5 text-[10px] font-bold outline-none border-2 border-black/10 shadow-inner"
                                value={selectedTahun}
                                onChange={(e) => setSelectedTahun(e.target.value)}
                            >
                                <option value="">Pilih Tahun</option>
                                {listTahunAjaran.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.TAHUN}
                                    </option>
                                ))}       
                            </select>
                        </div>
                        <button 
                            onClick={() => {setIsModalOpen(true); fetchDataModal()}}
                            className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2 hover:bg-gray-100 border-2 border-black/10 mt-4 active:scale-95 transition-transform"
                        >
                            <Pencil size={12} className="text-blue-500" />
                            <span className="text-[10px] font-black uppercase">Edit</span>
                        </button>
                    </div>

                    <div className="w-40 md:w-64 lg:w-80 transition-all duration-300">
                        <img
                            src="/img/guru-ilustrasi.png"
                            alt="Ilustrasi Guru"
                            className="w-full drop-shadow-2xl"
                            onError={(e) => e.target.style.display = 'none'}
                        />
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-center justify-center p-4">
                    <div className="bg-[#B2A4D4] w-[95%] max-w-2xl rounded-[30px] border-4 border-black p-4 md:p-8 relative shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-6 md:top-6 md:right-8 font-black text-xl md:text-2xl hover:text-red-600 transition-colors">X</button>
                        <h2 className="text-2xl md:text-4xl font-black text-center mb-6 md:mb-10 tracking-tighter">Edit</h2>

                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex flex-col gap-2 w-full md:w-48 mb-4 md:mb-0">
                                {["Edit Nama Siswa", "Pindah Siswa", "Hapus Siswa", "Edit Tahun Ajaran", "Edit Kelas"].map ((menu) => (
                                    <button
                                        key={menu}
                                        onClick={() => setActiveTab(menu)}
                                        className={`p-2 px-3 text-left font-black border-2 border-black rounded-lg text-[9px] md:text-[11px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all active:shadow-none active:translate-y-0.5 whitespace-nowrap overflow-hidden text-ellipsis ${activeTab === menu ? "bg-[#3498DB] text-white" : "bg-[#D9D9D9] text-black hover:bg-gray-300"}`} 
                                    >
                                        {menu}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1">
                                {activeTab === "Edit Nama Siswa" && (
                                    <div className="animate-in fade-in duration-300 space-y-3">
                                        <h3 className="font-black mb-2 uppercase text-sm">Edit Nama Siswa</h3>

                                        <div className="bg-[#3498DB] border-4 border-black rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                            <div className="p-2 bg-white/10 border-b-4 border-black">
                                                <div className="bg-white rounded-full flex items-center px-3 py-1 w-full border-2 border-black">
                                                    <input
                                                        type="text" placeholder="CARI NAMA SISWA..."
                                                        className="w-full text-[10px] font-bold outline-none uppercase"
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                    />
                                                       <Search size={14} className="text-gray-400"/>
                                                </div>
                                            </div>

                                            <div className="p-2 bg-white/5 border-b-4 border-black">
                                                <select
                                                    className="w-full rounded-full px-3 py-1 text-[10px] border-2 border-black outline-none font-bold uppercase bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                    value={filterKelasSiswa}
                                                    onChange={(e) => setFilterKelasSiswa(e.target.value)}
                                                >
                                                    <option value="">TAMPILKAN SEMUA SISWA</option>
                                                    {daftarKelas.map((item) => (
                                                        <option key={item.id} value={item.id}>
                                                            Kelas {item.NAMA_KELAS}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="h-40 overflow-y-auto p-3 space-y-2 bg-[#3498DB]">
                                                {dataSiswaModal
                                                    .filter((siswa) => {
                                                        const matchSearch = siswa.NAMA_SISWA?.toLowerCase().includes(searchTerm.toLowerCase());
                                                        const matchKelas = filterKelasSiswa ? (siswa.ID_KELAS === filterKelasSiswa) : true;

                                                        return matchSearch && matchKelas;
                                                    })

                                                    .map((siswa) => (
                                                        <div key={siswa.id} className="bg-white border-2 border-black rounded-xl p-2 px-3 flex justify-between items-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                            {siswaSedangDiedit === siswa.id ? (
                                                                <input
                                                                    className="flex-1 text-[10px] font-black uppercase outline-none bg-yellow-100 p-1 rounded border border-dashed border-black"
                                                                    value={editNamaSiswa}
                                                                    onChange={(e) => setEditNamaSiswa(e.target.value)}
                                                                    autoFocus
                                                                />
                                                            ) : (
                                                                <div className="flex flex-col">
                                                                    <span className="text-[8px] font-black opacity-50 uppercase leading-none">{daftarKelas.find(k => k.id === siswa.ID_KELAS)?.NAMA_KELAS || "Tanpa Kelas"}</span>
                                                                    <span className="text-[10px] font-black uppercase truncate mr-2">{siswa.NAMA_SISWA}</span>
                                                                </div>
                                                            )}

                                                            <button
                                                                onClick={() => {
                                                                    if (siswaSedangDiedit === siswa.id) {
                                                                        handleSimpanNamaSiswa(siswa.id);
                                                                    } else {
                                                                        setSiswaSedangDiedit(siswa.id);
                                                                        setEditNamaSiswa(siswa.NAMA_SISWA);
                                                                    }
                                                                }}
                                                                className={`${siswaSedangDiedit === siswa.id ? 'bg-[#2ECC71]' : 'bg-[#F1C40F]'} border-2 border-black px-2 md:px-3 py-1 rounded-full text-[7px] md:text-[8px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5 transition-all ml-2 shrink-0`}
                                                            >
                                                                {siswaSedangDiedit === siswa.id ? "SIMPAN" : "✎ EDIT"}
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                
                                {activeTab === "Pindah Siswa" && (
                                    <div className="animate-in fade-in duration-300 space-y-3">
                                        <h3 className="font-black mb-1 uppercase text-sm md:text-md tracking-tight text-left ml-1">Pindah Kelas</h3>

                                        <div className="bg-[#3498DB] border-4 border-black rounded-2xl p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                            <p className="text-[9px] font-black uppercase text-white mb-1 ml-1">Target Kelas Tujuan:</p>
                                            <select
                                                className="w-full rounded-xl px-3 py-1.5 text-[10px] border-2 border-black font-black uppercase bg-white"
                                                value={kelasTujuanPindah}
                                                onChange={(e) => setKelasTujuanPindah(e.target.value)}
                                            >
                                                <option value="">PILIH KELAS TUJUAN</option>
                                                {daftarKelas.map(k => (
                                                    <option key={k.id} value={k.id}>KELAS {k.NAMA_KELAS}</option>
                                                ))}
                                            </select>

                                            <select
                                                value={tahunTujuanPindah}
                                                onChange={(e) => setTahunTujuanPindah(e.target.value)}
                                                className="w-full p-2 mt-2 rounded-xl border-2 border-black font-black uppercase text-[10px] bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] outline-none"                                  
                                            >
                                                <option value="">PILIH TAHUN AJARAN</option>
                                                {listTahunAjaran.map((t) => (
                                                    <option key={t.id} value={t.TAHUN}>
                                                        {t.TAHUN}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="bg-[#3498DB] border-4 border-black rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                            <div className="p-3 bg-white/10 border-b-4 border-black space-y-3">
                                                <div className="flex justify-between items-center px-1">
                                                    <h4 className="text-[10px] font-black uppercase text-white leading-none">DAFTAR SISWA (ASAL: {filterKelasSiswa || "SEMUA"})</h4>
                                                    <button
                                                        onClick={() => {
                                                            const filtered = dataSiswaModal.filter(s => filterKelasSiswa ? s.KELAS === filterKelasSiswa : true);
                                                            setSelectedSiswaIds(selectedSiswaIds.length === filtered.length ? [] : filtered.map(s => s.id));
                                                        }}
                                                        className="text-[9px] font-black underline uppercase text-white hover:text-yellow-300"
                                                    >
                                                        {selectedSiswaIds.length > 0 ? "Batal Semua" : "Pilih Semua"}
                                                    </button>
                                                </div>

                                                <div className="flex gap-2">
                                                    <div className="flex-1 bg-white rounded-lg flex items-center px-3 py-1 border-2 border-black">
                                                        <input
                                                            type="text" placeholder="CARI NAMA..."
                                                            className="w-full text-[10px] font-black outline-none uppercase bg-transparent"
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                        />
                                                        <Search size={12} className="text-gray-400" />
                                                    </div>
                                                    <select
                                                        className="rounded-lg px-1 py-1 text-[9px] border-2 border-black font-black uppercase bg-white outline-none"
                                                        value={filterKelasSiswa}
                                                        onChange={(e) => {setFilterKelasSiswa(e.target.value); setSelectedSiswaIds([]);}}
                                                    >
                                                        <option value="">ASAL: SEMUA</option>
                                                        {daftarKelas.map(k => (
                                                            <option key={k.id} value={k.id}>{k.NAMA_KELAS}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="h-44 overflow-y-auto p-3 space-y-2 bg-[#3498DB]">
                                                {dataSiswaModal
                                                    .filter(s => {
                                                        const mSearch = s.NAMA_SISWA?.toLowerCase().includes(searchTerm.toLowerCase());
                                                        const mKelas = filterKelasSiswa ? (s.ID_KELAS === filterKelasSiswa || s.KELAS === filterKelasSiswa) : true;
                                                        return mSearch && mKelas;
                                                    })
                                                    .map(s => (
                                                        <div
                                                            key={s.id}
                                                            onClick={() => setSelectedSiswaIds(prev => prev.includes(s.id) ? prev.filter(i => i !== s.id) : [...prev, s.id])}
                                                            className={`border-2 border-black rounded-xl p-2 px-3 flex justify-between items-center cursor-pointer transition-all active:scale-[0.98] ${selectedSiswaIds.includes(s.id) ? 'bg-yellow-100 translate-x-1' : 'bg-white'}`}
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="text-[6px] font-black opacity-40 uppercase leading-none">{daftarKelas.find(k => k.id === (s.ID_KELAS || s.KELAS))?.NAMA_KELAS || "Tanpa Kelas"}</span>
                                                                <span className="text-[10px] font-black uppercase">{s.NAMA_SISWA}</span>
                                                            </div>
                                                            <div className={`w-4 h-4 rounded border-2 border-black flex items-center justify-center ${selectedSiswaIds.includes(s.id) ? 'bg-[#2ECC71]' : 'bg-white'}`}>
                                                                {selectedSiswaIds.includes(s.id) && <div className="w-1.5 h-1.5 bg-white rounded-full"/>}
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>

                                            <div className="p-2.5 bg-[#3498DB] border-t-4 border-black">
                                                <button
                                                    onClick={handleBulkPindah}
                                                    disabled={selectedSiswaIds.length === 0 || !kelasTujuanPindah}
                                                    className={`w-full py-2 rounded-xl border-2 border-black font-black text-[10px] uppercase transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 ${selectedSiswaIds.length > 0 && kelasTujuanPindah ? 'bg-[#2ECC71] text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                                >
                                                    {selectedSiswaIds.length > 0 ? `PINDAHKAN KE ${daftarKelas.find(k => k.id === kelasTujuanPindah)?.NAMA_KELAS || kelasTujuanPindah}` : 'PILIH SISWA & TUJUAN'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "Hapus Siswa" && (
                                    <div className="animate-in fade-in duration-300 space-y-3">
                                        <h2 className="font-black mb-1 uppercase text-sm md:text-md tracking-tight text-left ml-1 text-black">HAPUS SISWA</h2>
                                        <div className="flex flex-col">
                                            <h3 className="font-black text-[10px] uppercase ml-1 mb-1 text-black">Pilih Kelas</h3>
                                            <div className="bg-[#3498DB] border-4 border-black rounded-2xl p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                                <select 
                                                    value={selectedHapusKelas}
                                                    onChange={(e) => {
                                                        setSelectedHapusKelas(e.target.value);
                                                        setSearchSiswaHapus("");
                                                        setSelectedSiswaHapus([]);
                                                    }}
                                                    className="w-full bg-white border-2 border-black rounded-xl p-2 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] outline-none"
                                                >
                                                    <option value="">SEMUA</option>
                                                    {daftarKelas.map((kelas) => (
                                                        <option key={kelas.id} value={kelas.id}>{kelas.NAMA_KELAS}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex flex-col">
                                            <h3 className="font-black text-[10px] uppercase ml-1 mb-1 text-black">Daftar Siswa</h3>
                                            <div className="bg-[#3498DB] border-4 border-black rounded-2xl overflow-hidden shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">

                                                <div className="p-2 border-b-2 border-black bg-white/10 flex items-center gap-2">
                                                    <div className="bg-white border-2 border-black rounded-lg flex items-center px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] grow">
                                                        <input 
                                                            type="text" placeholder="CARI NAMA..."
                                                            className="w-full text-[10px] font-black outline-none bg-transparent uppercase"
                                                            value={searchSiswaHapus || ""}
                                                            onChange={(e) => setSearchSiswaHapus(e.target.value)}
                                                        />
                                                        <Search size={14}/>
                                                    </div>

                                                        {selectedHapusKelas && (
                                                            <button 
                                                                onClick={toggleSelectAllSiswaHapus}
                                                                className="text-[9px] font-black underline uppercase text-white hover:text-yellow-300 transition-colors"
                                                            >
                                                                {selectedSiswaHapus.length > 0 && selectedSiswaHapus.length === daftarSiswa.filter(s => selectedHapusKelas && s.NAMA_SISWA?.toLowerCase().includes(searchSiswaHapus.toLowerCase())).length
                                                                    ? "Batal Semua" : "Pilih Semua"
                                                                }
                                                            </button>
                                                        )}                                                 
                                                    </div>
                                                
                                                <div className="h-48 overflow-y-auto p-3 space-y-1.5 bg-[#3498DB] scrollbar-hide">
                                                    {dataSiswaModal
                                                        .filter(s => {
                                                            const searchLow = (searchSiswaHapus || "").toString().toLowerCase();

                                                            const matchKelas = selectedHapusKelas ? (s.ID_KELAS === selectedHapusKelas || s.KELAS === selectedHapusKelas) : true;
                                                            const matchSearch = (s.NAMA_SISWA || "").toString().toLowerCase().includes(searchLow);

                                                            return matchKelas && matchSearch;
                                                        })

                                                        .map((siswa) => {
                                                            const isChecked = selectedSiswaHapus.includes(siswa.id);
                                                            return(
                                                                <div
                                                                    key={siswa.id}
                                                                    onClick={() => isChecked
                                                                        ? setSelectedSiswaHapus(selectedSiswaHapus.filter(id => id !== siswa.id))
                                                                        : setSelectedSiswaHapus([...selectedSiswaHapus, siswa.id])
                                                                    }
                                                                    className={`flex justify-between items-center p-2 px-4 rounded-xl border-2 border-black cursor-pointer transition-all active:scale-[0.98] ${isChecked ? 'bg-red-50 border-red-600' : 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}
                                                                >
                                                                <div className="flex flex-col">
                                                                    <span className="text-[7px] font-black opacity-40 uppercase leading-none text-left">
                                                                        {daftarKelas.find(k => k.id === (siswa.ID_KELAS || siswa.KELAS))?.NAMA_KELAS || "Tanpa Kelas"}                              
                                                                    </span>
                                                                    <span className="text-[10px] font-black text-black uppercase text-left">{siswa.NAMA_SISWA}</span>
                                                                </div>
                                                                    <div className={`w-4 h-4 rounded border-2 border-black flex items-center justify-center transition-all ${isChecked ? 'bg-red-600' : 'bg-white'}`}>
                                                                        {isChecked && <Check size={10} className="text-white font-bold"/>}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                        
                                                    {selectedHapusKelas === "" && dataSiswaModal.length === 0 && (
                                                        <div className="flex flex-col items-center justify-center mt-10 opacity-50">
                                                            <User size={32} className="text-white mb-2"/>
                                                            <p className="text-[9px] font-black text-white uppercase italic">Siswa akan muncul setelah kelas dipilih</p>                                                        
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="p-3 bg-white/10 border-t-2 border-black flex justify-between items-center">
                                                    <span className="text-[9px] font-black text-white uppercase italic">Terpilih: {selectedSiswaHapus.length} Siswa</span>
                                                    {selectedSiswaHapus.length > 0 && (
                                                        <button
                                                            onClick={handleBulkHapusSiswa}
                                                            className="bg-red-600 text-white text-[10px] font-black px-5 py-2 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5"
                                                        >
                                                            HAPUS DARI DAFTAR AKTIF
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                

                                {activeTab === "Edit Tahun Ajaran" && (
                                    <div className="animate-in fade-in duration-300">
                                        <div className="flex justify-between items-end mb-2">
                                            <h3 className="font-black mb-1 uppercase text-sm md:text-md tracking-tight text-left ml-1">Manajemen Tahun Ajaran</h3>
                                            {selectedTahunIds.length > 0 && (
                                                <button
                                                    onClick={handleBulkDeleteTahun}
                                                    className="bg-red-600 text-white text-[9px] font-black px-3 py-1 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5"
                                                >
                                                    HAPUS ({selectedTahunIds.length})
                                                </button>
                                            )}
                                        </div>

                                        <div className="bg-[#3498DB] border-4 border-black rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                            <div className="p-2 bg-white/10 border-b-4 border-black flex items-center gap-2">
                                                <div className="bg-white rounded-full flex items-center px-3 py-1 w-full border-2 border-black">
                                                    <input
                                                        type="text" placeholder="Cari Tahun..."
                                                        className="w-full text-[10px] font-bold outline-none uppercase"
                                                        value={searchTahun}
                                                        onChange={(e) => setSeacrhTahun(e.target.value)}
                                                    />
                                                    <Search size={14} className="text-gray-400"/>
                                                </div>
                                            </div>

                                            <div className="h-44 overflow-y-auto p-3 space-y-2 bg-[#3498DB]">
                                                {listTahunAjaran
                                                .filter(t => t.TAHUN?.toLowerCase().includes(searchTahun.toLowerCase()))
                                                .map((item) => {
                                                    const isSelected = selectedTahunIds.includes(item.id);

                                                    return (
                                                        <div key={item.id}
                                                        onClick={() => toggleSelectTahun(item.id)}
                                                        className={`border-2 border-black rounded-xl p-1.5 px-3 flex justify-between items-center cursor-pointer transition-all active:scale-[0.98] ${isSelected ? 'bg-yellow-100 shadow-none translate-x-0.5' : 'bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'}`}
                                                        >
                                                            <span className="text-[10px] font-black uppercase tracking-tight text-black">{item.TAHUN}</span>
                                                            <div
                                                                className={`w-4 h-4 rounded border-2 border-black flex items-center justify-center transition-colors ${isSelected ? 'bg-red-500' : 'bg-white'}`}>
                                                                {isSelected && <X size={14} className="text-white font-bold"/>}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="p-2.5 bg-[#3498DB] border-t-4 border-black flex gap-2">
                                                <input
                                                    type="text" placeholder="Tambah Tahun Ajaran..."
                                                    className="flex-1 rounded-xl px-3 py-2 text-[10px] border-2 border-black outline-none font-black uppercase bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                    value={newTahun}
                                                    onChange={(e) => setNewTahun(e.target.value)}
                                                />

                                                <button onClick={handleTambahTahun} className="bg-[#2ECC71] border-2 border-black px-4 py-2 rounded-xl text-[9px] font-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all">
                                                    {loading ? "..." : "+ TAMBAH"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                        
                                {activeTab === "Edit Kelas" && (
                                    <div className="animate-in fade-in duration-300">
                                        <div className="flex justify-between items-end mb-2">
                                            <h3 className="font-black mb-1 uppercase text-sm md:text-md tracking-tight text-left ml-1">Edit Kelas</h3>
                                            {selectedKelasIds.length > 0  && (
                                                <button
                                                    onClick={() => handleProsesHapus()}
                                                    className="bg-red-600 text-white text-[9px] font-black px-3 py-1 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-0.5"
                                                >
                                                    HAPUS ({selectedKelasIds.length})
                                                </button>
                                            )} 
                                        </div>
                                        
                                        
                                        <div className="bg-[#3498DB] border-4 border-black rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                            <div className="p-3 bg-white/10 border-b-4 border-black">
                                                <div className="bg-white rounded-xl flex items-center px-3 py-1.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                    <input
                                                        type="text" placeholder="CARI KELAS..." className="w-full text-[10px] font-bold outline-none"
                                                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                                    />
                                                    <Search size={14} className="text-gray-400"/>
                                                </div>
                                            </div>

                                            <div className="h-44 overflow-y-auto p-3 space-y-2 bg-[#3498DB]">
                                                {daftarKelas.filter(k => k.NAMA_KELAS?.toLowerCase().includes(searchTerm.toLowerCase())).map((kelas) => (
                                                    <div key ={kelas.id} 
                                                        onClick={() => toggleSelect(kelas.id)}
                                                        className={`border-2 border-black rounded-xl p-1.5 px-3 flex justify-between items-center cursor-pointer transition-all active:scale-[0.98] ${selectedKelasIds.includes(kelas.id) ? 'bg-yellow-100 shadow-none translate-x-0.5' : 'bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'}`}
                                                    >
                                                        <span className="text-[10px] font-black uppercase tracking-tight">{kelas.NAMA_KELAS}</span>
                                                        <div className={`w-5 h-5 rounded border-2 border-black flex items-center justify-center transition-colors ${selectedKelasIds.includes(kelas.id) ? 'bg-red-500' : 'bg-white'}`}>
                                                            {selectedKelasIds.includes(kelas.id) && <X size={14} className="text-white font-bold"/>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                                    <div className="p-2.5 bg-[#3498DB] border-t-4 border-black flex flex-col gap-2">
  
                                                    <select 
                                                        value={selectedTahun} 
                                                        onChange={(e) => setSelectedTahun(e.target.value)}
                                                        className="w-full rounded-xl px-3 py-2 text-[10px] border-2 border-black font-black uppercase bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                    >
                                                    <option value="">-- PILIH TAHUN --</option>
                                                        {listTahunAjaran.map((t) => (
                                                        <option key={t.id} value={t.id}>{t.TAHUN}</option>
                                                    ))}
                                                    </select>

                                                    <div className="flex gap-2">
        
                                                    <input
                                                        type="text" placeholder="Nama Kelas Baru..."
                                                        className="flex-1 rounded-xl px-3 py-2 text-[10px] border-2 border-black outline-none font-black uppercase bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                        value={newKelasName} onChange={(e) => setNewKelasName(e.target.value)}
                                                    />
                                                    <button onClick={handleTambahKelas} className="bg-[#2ECC71] border-2 border-black px-4 py-2 rounded-xl text-[9px] font-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all">+ TAMBAH</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {!["Edit Nama Siswa", "Pindah Siswa", "Hapus Siswa", "Edit Tahun Ajaran", "Edit Kelas"].includes(activeTab) && (
                                    <div className="flex items-center justify-center h-full opacity-30 italic font-black text-sm uppercase">
                                        Menu {activeTab} Belum Tersedia
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mt-12 border-t-4 border-black w-full opacity-20"></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManajemenSiswa;