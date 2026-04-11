import React, { useState, useEffect } from "react";
import { db, auth } from "../lib/Firebase";
import { collection, addDoc, onSnapshot, query, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { Plus, Search, ChevronDown, Pencil, Trash2, X, Sparkles, Calculator, Clock, Trophy } from "lucide-react"

const BankSoal = () => {

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dataEdit, setDataEdit] = useState(null);
    const [soalList, setSoalList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterLevel, setFilterLevel] = useState("SEMUA");
    const [filterOperasi, setFilterOperasi] = useState("SEMUA");

    useEffect(() => {
        const q = query(collection(db, "SOAL"));

        const unsubscribe = onSnapshot (q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSoalList(data);   
        });
        
    return () => unsubscribe();
}, []);

    const handleHapus = async (id, teksSoal) => {
        const konfirmasi = window.confirm(`Apakah anda yakin ingin menghapus soal: ${teksSoal}?`);

        if (konfirmasi) {
            try {
                await deleteDoc(doc(db, "SOAL", id));
                alert("Soal berhasil dihapus!");
            } catch (err) {
                console.error("Error saat menghapus:", err);
                alert("Gagal menghapus soal. Coba lagi!");
            }
        }

    };

    const bukaModalEdit = (soal) => {
        setDataEdit(soal);
        setIsModalOpen(true);
    };

    const soalTersaring = soalList.filter((soal) => {
        const cocokSearch =
            soal.ANGKA_1.toString().includes(searchTerm) ||
            soal.ANGKA_2.toString().includes(searchTerm) ||
            soal.OPERASI.includes(searchTerm);
        
        const cocoLevel = filterLevel === "SEMUA" || soal.TINGKAT_KESULITAN === filterLevel;

        const cocokOperasi = filterOperasi === "SEMUA" || soal.OPERASI === filterOperasi;

        return cocokSearch && cocoLevel && cocokOperasi;
    });

    return (
        <div className="h-screen w-full bg-[#B2A4D4] p-4 md:p-10 pt-24 md:pt-10 flex flex-col items-center overflow-hidden font-sans text-black">

            <div className="w-full max-w-5xl mb-4 px-2 flex justify-between items-start relative min-h-30">
                <div className="relative z-20">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tighter leading-none uppercase">
                        BANK SOAL <br /> MENTAL MATH
                    </h1>
                </div>

                <div className="absolute -top-12 -right-10 w-32 md:w-52 lg:w-60 z-0 hidden md:block pointer-events-none">
                    <img
                        src="/img/bank-soal-ilustrasi.png"
                        alt="Ilustrasi"
                        className="w-full object-contain"
                    />
                </div>
            </div>

            <div className="w-full max-w-5xl bg-[#D9D9D9] rounded-[30px] md:rounded-[40px] p-4 md:p-8 shadow-2xl relative z-10 flex flex-col overflow-hidden border border-white/10">
                <div className="flex flex-col lg:flex-row items-center gap-3 mb-6 relative z-20">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full lg:w-auto bg-[#5DADE2] hover:s text-white px-5 py-2 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase transition-all shadow-md active:scale-95">
                            <Plus size={14} strokeWidth={4} />
                            TAMBAH SOAL BARU
                    </button>

                    <div className="relative w-full lg:w-56">
                        <input
                            type="text"
                            placeholder="PENCARIAN"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#C4C4C4] border border-black/10 rounded-xl px-9 py-2 text-[10px] font-black uppercase outline-none placeholder:text-black/40 focus:bg-white transition-all shadow-inner"
                        />
                        <Search size={14} className="absolute left-3 top-2.5 text-black/40" />
                    </div>

                    <div className="flex gap-2 w-full lg:w-auto lg:ml-auto font-black uppercase text-[9px]">
                        <select 
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                            className="flex-1 lg:flex-none bg-[#C4C4C4] border border-black/10 px-4 py-2 rounded-xl flex items-center justify-between gap-4 cursor-pointer hover:bg-white/20 transition-colors shadow-sm">
                            
                            <option value="SEMUA">SEMUA LEVEL</option>
                            <option value="MUDAH">MUDAH</option>
                            <option value="SEDANG">SEDANG</option>
                            <option value="SULIT">SULIT</option>
                        </select>
                        <select
                            value={filterOperasi}
                            onChange={(e) => setFilterOperasi(e.target.value)} 
                            className="flex-1 lg:flex-none bg-[#C4C4C4] border border-black/10 px-4 py-2 rounded-xl flex items-center justify-between gap-4 cursor-pointer hover:bg-white/20 transition-colors shadow-sm">
                            
                            <option value="SEMUA">SEMUA OPERASI</option>
                            <option value="+">TAMBAH (+)</option>
                            <option value="-">KURANG (-)</option>
                            <option value="x">KALI (×)</option>
                            <option value=":">BAGI (÷)</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-[20px] border border-black/5 bg-white/40 shadow-inner relative z-10 overflow-y-auto max-h-112.5">
                    <table className="w-full border-collapse min-w-175">
                        <thead className="sticky top-0 z-30 bg-[#A9CCE3]">
                            <tr className="border-b border-black/5"> 
                                <th className="p-3 text-[10px] font-black uppercase text-left w-12 pl-5 text-gray-700">No.</th>
                                <th className="p-3 text-[10px] font-black uppercase text-left pl-6 text-gray-700">Pertanyaan</th>
                                <th className="p-3 text-[10px] font-black uppercase text-center w-32 text-gray-700">Kunci Jawaban</th>
                                <th className="p-3 text-[10px] font-black uppercase text-center w-40 text-gray-700">Tingkat Kesulitan</th>
                                <th className="p-3 text-[10px] font-black uppercase text-center w-44 text-gray-700">Aksi</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-black/5">
                            {soalTersaring.length > 0 ? (
                                soalTersaring.map((soal, index) => (
                                    <tr key={soal.id || index} className="hover:bg-white/40 transition-colors group">
                                        <td className="p-3 pl-5 text-xs font-black text-gray-500">{index + 1}</td>
                                        <td className="p-3 pl-6 text-sm font-black italic text-gray-800 tracking-tight">
                                            {soal.ANGKA_1} {soal.OPERASI === "x" ? "×" : soal.OPERASI === ":" ? "÷" : soal.OPERASI} {soal.ANGKA_2}
                                        </td>
                                        <td className="p-3 text-sm font-black text-center font-mono tracking-widest text-gray-900">
                                            {soal.JAWABAN}
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className={`${
                                                soal.TINGKAT_KESULITAN === "SULIT" ? "bg-red-500" :
                                                soal.TINGKAT_KESULITAN === "SEDANG" ? "bg-yellow-500" : "bg-green-500"
                                            } text-white px-4 py-1 rounded-full text-[9px] font-black uppercase inline-block w-20 text-center shadow-sm`}>
                                                {soal.TINGKAT_KESULITAN}
                                            </span>
                                        </td>
                                        <td className="p-3 px-4">
                                            <div className="flex justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => bukaModalEdit(soal)} 
                                                    className="bg-[#5DADE2] text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 hover:bg-blue-600 transition-all shadow-sm active:scale-95">
                                                    <Pencil size={11} fill="white" /> 
                                                    EDIT
                                                </button>
                                                <button 
                                                    onClick={() => handleHapus(soal.id, `${soal.ANGKA_1} ${soal.OPERASI} ${soal.ANGKA_2}`)} 
                                                    className="bg-[#E74C3C] text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 hover:bg-red-600 transition-all shadow-sm active:scale-95">
                                                    <Trash2 size={11} fill="white" />
                                                    HAPUS
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-10 text-center text-[10px] font-black text-gray-400 uppercase italic">
                                        Belum ada soal tersedia.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="h-4 md:h-6"></div>
            </div>

            <ModalTambahSoal 
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setDataEdit(null);
                }}
                dataEdit={dataEdit}
            />
        </div>
    );

};

export default BankSoal;

const ModalTambahSoal = ({ isOpen, onClose, dataEdit }) => {

    const [tingkat, setTingkat] = useState("MUDAH");
    const [jawaban, setJawaban] = useState("");
    const [operator, setOperator] = useState("+");
    const [angka1, setAngka1] = useState("");
    const [angka2, setAngka2] = useState("");
    const [poin, setPoin] = useState(10);
    const [durasi, setDurasi] = useState(15);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const a1 = parseFloat(angka1);
        const a2 = parseFloat(angka2);

        if (!isNaN(a1) && !isNaN(a2)) {
            let hasil = 0;
            if (operator === "+") hasil = a1 + a2;
            if (operator === "-") hasil = a1 - a2;
            if (operator === "x") hasil = a1 * a2;
            if (operator === ":") {
                if (a2 !== 0) {
                    const res = a1 / a2;
                    hasil = Number.isInteger(res) ? res : res.toFixed(2);
                } else {
                    hasil = 0;
                }
            }
            setJawaban(hasil);
        } else {
            setJawaban("");
        }
    }, [angka1, angka2, operator]);

    useEffect (() => {
        if (isOpen) {
            if (dataEdit) {
                setTingkat(dataEdit.TINGKAT_KESULITAN);
                setOperator(dataEdit.OPERASI);
                setAngka1(dataEdit.ANGKA_1.toString());
                setAngka2(dataEdit.ANGKA_2.toString());
                setJawaban(dataEdit.JAWABAN);
                setPoin(dataEdit.NILAI_SOAL);
                setDurasi(dataEdit.WAKTU_SOAL);
            } else {
                setTingkat("MUDAH");
                setOperator("+");
                setAngka1("");
                setAngka2("");
                setJawaban("");
                setPoin(10);
                setDurasi(15);
            }
        }
    }, [dataEdit, isOpen]);

    const generateSoal = () => {
        let max = tingkat === "SULIT" ? 999 : tingkat === "SEDANG" ? 100 : 20;
        let n1 = Math.floor(Math.random() * max) + 1;
        let n2 = Math.floor(Math.random() * max) + 1;
        if (operator === ":" && n2 > n1) [n1, n2] = [n2, n1];

        setAngka1(n1.toString());
        setAngka2(n2.toString());

        const basePoin = tingkat === "SULIT" ? 10 : tingkat === "SEDANG" ? 10 : 10;
        let baseDurasi = tingkat === "SULIT" ? 110 : tingkat === "SEDANG"? 40 : 10;
        if (operator === "x" || operator === ":") baseDurasi += 10;
        setPoin(basePoin); setDurasi(baseDurasi);
    };

    const handleSimpan = async () => {
        if (!angka1 || !angka2 || jawaban === "") return alert("Lengkapi angka dulu!");
        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) {alert ("Sesi berakhir, login ulang."); return; }

            const payload = {
                ANGKA_1: Number(angka1),
                ANGKA_2: Number(angka2),
                OPERASI: operator,
                JAWABAN: jawaban.toString(),
                TINGKAT_KESULITAN: tingkat,
                NILAI_SOAL: Number(poin),
                WAKTU_SOAL: Number(durasi),
            };

            if (dataEdit) {
                await updateDoc(doc(db, "SOAL", dataEdit.id), payload);
                alert("Soal Berhasil Diperbarui!");
            } else {
                await addDoc(collection(db, "SOAL"), {
                    ...payload,
                    ID_GURU: user.uid
                });
                alert("Soal Berhasil Disimpan!");
            }

            onClose();
        } catch (err) {
            console.error(err);
            alert("Gagal menyimpan ke database.");
        } finally {
            setLoading(false);           
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-center justify-center p-4 font-sans">
            <div className="bg-[#B2A4D4] w-full max-w-2xl rounded-[30px] border-4 border-black p-6 md:p-8 relative shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[90vh] overflow-y-auto">

                <button onClick={onClose} className="absolute top-4 right-6 font-black text-2xl hover:text-red-600 transition-colors">X</button>
                <h2 className="text-2xl md:text-4xl font-black text-center mb-8 tracking-tighter uppercase">{dataEdit ? "Edit Soal" : "Tambah Soal Baru"}</h2>

                <div className="flex flex-col gap-6">
                    <div className="bg-[#3498DB] border-4 border-black rounded-2xl p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                        <h3 className="font-black text-white text-xs mb-3 uppercase tracking-widest">Konfigurasi Angka</h3>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black text-white uppercase ml-1">Angka 1</label>
                                <input type="number" className="w-full bg-white border-2 border-black rounded-xl p-2 font-black text-center outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" value={angka1} onChange={(e) => setAngka1(e.target.value)} />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black text-white uppercase ml-1">Op</label>
                                <select className="w-full bg-white border-2 border-black rounded-xl p-2 font-black text-center outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" value={operator} onChange={(e) => setOperator(e.target.value)}>
                                    <option value="+">+</option><option value="-">-</option><option value="x">×</option><option value=":">÷</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black text-white uppercase ml-1">Angka 2</label>
                                <input type="number" className="w-full bg-white border-2 border-black rounded-xl p-2 font-black text-center outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" value={angka2} onChange={(e) => setAngka2(e.target.value)} />
                            </div>
                        </div>
                        <button onClick={generateSoal} className="w-full mt-4 bg-[#2ECC71] border-2 border-black py-2 rounded-xl flex items-center justify-center gap-2 font-black text-white text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-1">
                            <Sparkles size={16} /> BUAT SOAL
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white border-4 border-black rounded-2xl p-4 flex flex-col items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <span className="text-[8px] font-black opacity-30 uppercase mb-2">Tampilan Siswa</span>
                            <div className="text-3xl font-black tracking-tighter">
                                {angka1 || "?"} {operator === ":" ? "÷" : operator === "x" ? "×" : operator} {angka2 || "?"} = ...
                            </div>
                        </div>

                        <div className="bg-[#F1C40F] border-4 border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center">
                            <label className="text-[10px] font-black uppercase mb-1">Kunci Jawaban</label>
                            <div className="bg-white border-2 border-black rounded-lg p-2 text-xl font-black text-center">
                                {jawaban}                                  
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border-4 border-black rounded-2xl p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] grid grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-black uppercase flex items-center gap-1"><Calculator size={10}/> Level</label>
                            <select className="border-2 border-black rounded-lg p-1 text-[10px] font-bold" value={tingkat} onChange={(e) => setTingkat(e.target.value)}>
                                <option value="MUDAH">MUDAH</option><option value="SEDANG">SEDANG</option><option value="SULIT">SULIT</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-black uppercase flex items-center gap-1"><Trophy size={10}/> Poin</label>
                            <input type="number" className="border-2 border-black rounded-lg p-1 text-[10px] font-bold text-center" value={poin} onChange={(e) => setPoin(e.target.value)} />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-black uppercase flex items-center gap-1"><Clock size={10}/> Detik</label>
                            <input type="number" className="border-2 border-black rounded-lg p-1 text-[10px] font-bold text-center" value={durasi} onChange={(e) => setDurasi(e.target.value)} />
                        </div>
                    </div>

                    <button onClick={handleSimpan} disabled={loading} className="w-full bg-[#3498DB] text-white border-4 border-black py-4 rounded-2xl font-black text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 mt-4 uppercase">
                        {loading ? "Menyimpan..." : dataEdit ? "Simpan Perubahan" : "Simpan ke Bank Soal"}
                    </button>
                </div>
            </div>
        </div>
  );
};
