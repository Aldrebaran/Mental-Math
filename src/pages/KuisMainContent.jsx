import React, { useEffect, useState } from "react";
import { auth, db } from "../lib/Firebase";
import { collection, getDocs, addDoc, serverTimestamp, onSnapshot, query, where } from "firebase/firestore";
import QuizRoom from "../components/QuizRoom";

const KuisMainContent = ({role}) => {

    const [localQuizzes, setLocalQuizzes] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [daftarKelas, setDaftarKelas] = useState([]);
    const [allSoal, setAllSoal] = useState([]);
    const [selectedSoal, setSelectedSoal] = useState([]);

    const [judulKuis, setJudulKuis] = useState("");
    const [idKelasTerpilih, setIdKelasTerpilih] = useState("");
    const [durasiKuis, setDurasiKuis] = useState(15);
    

    const [timeLeft, setTimeLeft] = useState({})

    const [activeQuizId, setActiveQuizId] = useState(null);

    const [stats, setStats] = useState({ totalKuis: 0, rataNilai: 0, rataWaktu: 0 })

    const openKuisModal = async () => {
        setIsModalOpen(true);
        setLoading(true);

        try {
            const querySnapshot = await getDocs(collection(db, "KELAS"));
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data()}));
            setDaftarKelas(data);
            if (data.length > 0) setIdKelasTerpilih(data[0].id);
        } catch (e) {console.error(e);}
        setLoading(false);
    };

    const handleNextStep = async () => {
        if (!judulKuis) return alert ("JUDUL WAJIB DI ISI!");
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "SOAL"));
            const data = querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
            setAllSoal(data);
            setStep(2);
        } catch (e) {console.error(e);}
        setLoading(false);
    };

    const handleGenerate = (tingkat, operasi) => {
        let filtered = allSoal;

        if (tingkat !== "CAMPUR") {
            filtered = filtered.filter(s => s.TINGKAT_KESULITAN === tingkat);
        }

        if (operasi !== "SEMUA") {
            filtered = filtered.filter(s => s.OPERASI === operasi);
        }

        if (filtered.length < 1) {
            return alert("SOAL TIDAK DITEMUKAN DENGAN KRITERIA TERSEBUT!");
        }

        const acak = filtered.sort(() => 0.5 - Math.random()).slice(0, 10);

        setSelectedSoal(acak.map((soal, i ) => ({
            ID_SOAL: soal.id,
            NOMOR_SOAL: i + 1,
            BOBOT_NILAI: soal.NILAI_SOAL || 0,
            PREVIEW: `${soal.ANGKA_1} ${soal.OPERASI} ${soal.ANGKA_2}`,
            TINGKAT: soal.TINGKAT_KESULITAN
        })));        
    };

    const handleSimpanFinal = async () => {
        const user = auth.currentUser;
        if (!user) return alert("SESI BERAKHIR, SILAHKAN LOGIN ULANG!");

        const total = selectedSoal.reduce((acc, curr) => acc + Number(curr.BOBOT_NILAI), 0);
        if (total !== 100) return alert("NILAI HARUS 100!");

        setLoading(true);
        try {
            const sekarang = new Date();
            const waktuSelesaiManual = new Date(sekarang.getTime() + durasiKuis * 60000)

            const kuisRef = await addDoc(collection(db, "KUIS"), {
                JUDUL_KUIS: judulKuis.toUpperCase(),
                WAKTU_MULAI: serverTimestamp(),
                WAKTU_SELESAI: waktuSelesaiManual,
                WAKTU_BERSIH: Number(durasiKuis),
                STATUS: "AKTIF",
                SKOR_MAKSIMAL: 100,
                LIST_SOAL: selectedSoal.map(s => s.ID_SOAL),
                ID_GURU: user.uid,
                ID_KELAS: idKelasTerpilih
            });

            for (const s of selectedSoal) {
                await addDoc(collection(db, "DETAIL_KUIS"),{
                    ID_KUIS: kuisRef.id,
                    ID_SOAL: s.ID_SOAL,
                    NOMOR_SOAL: parseInt(s.NOMOR_SOAL),
                    BOBOT_NILAI: parseInt(s.BOBOT_NILAI)
                });
            }

            alert("KUIS BERHASIL DIPUBLIKASIKAN!");
            resetModal();
        } catch (e) {
            console.error("ERROR SIMPAN:", e);
            alert("GAGAL MENYIMPAN KE DATABASE!");
        } finally {
            setLoading(false);
        }
    };

    const handleHapusSoal = (id) => {
        setSelectedSoal(selectedSoal.filter(s => s.ID_SOAL !== id));
    };

    const totalBobot = selectedSoal.reduce((acc, s) => acc + Number(s.BOBOT_NILAI), 0);

    const resetModal = () => {
        setIsModalOpen(false);
        setStep(1);
        setJudulKuis("");
        setSelectedSoal([]);
        setIdKelasTerpilih(daftarKelas.length > 0 ? daftarKelas[0].id : "");
        setDurasiKuis(15);
    };

    const kuisAktif = localQuizzes.filter(quiz => {
        if (!quiz.WAKTU_SELESAI) return true;
        const sekarang = new Date();
        const finish = quiz.WAKTU_SELESAI?.toDate ? quiz.WAKTU_SELESAI.toDate() : new Date(quiz.WAKTU_SELESAI);
        return sekarang < finish;
    });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const qKuis = query(collection(db, "KUIS"), where("STATUS", "==", "AKTIF"));

    const unsubscribe = onSnapshot(qKuis, async (snapshot) => {
        let dataKuis = snapshot.docs.map(doc => {
            const d = doc.data();
            return {
                id: doc.id,
                ...d,
                title: d.JUDUL_KUIS,
                durationSeconds: Math.max(0, Math.floor(((d.WAKTU_SELESAI?.toDate() || new Date()) - new Date()) / 1000)),
                totalQuestions: d.LIST_SOAL?.length || 0
            };
        });

        if (role !== "guru") {
            try {
                const qSiswa = query(collection(db, "SISWA"), where("email", "==", user.email));
                const snapSiswa = await getDocs(qSiswa);
                
                if (!snapSiswa.empty) {
                    const idKelasSiswa = snapSiswa.docs[0].data().ID_KELAS;
                    dataKuis = dataKuis.filter(kuis => String(kuis.idKelasTerpilih) === String(idKelasSiswa));
                } else {
                    dataKuis = [];
                }
            } catch (err) {
                console.error("Gagal memfilter kelas siswa:", err);
            }
        }
        
        setLocalQuizzes(dataKuis);
    });

    return () => unsubscribe();
}, [role]); 

    useEffect(() => {
    const fetchStats = async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            let q;
            if (role?.toUpperCase() === 'GURU') {
                q = query(collection(db, "HASIL_KUIS"));
            } else {
                q = query(collection(db, "HASIL_KUIS"), where("ID_SISWA", "==", user.uid));
            }

            const snap = await getDocs(q);
            const docs = snap.docs.map(d => d.data());

            if (docs.length > 0) {
                const total = docs.length;
                
                const sumNilai = docs.reduce((acc, curr) => acc + (curr.SKOR_AKHIR || 0), 0);
                
                const sumWaktu = docs.reduce((acc, curr) => acc + (curr.DURASI_KERJA_DETIK || 0), 0);

                setStats({
                    totalKuis: total,
                    rataNilai: Math.round(sumNilai / total),
                    rataWaktu: Math.round(sumWaktu / total)
                });
            }
        } catch (e) {
            console.error("Gagal hitung statistik:", e);
        }
    };

    fetchStats();
}, [role]); 

    useEffect(() => {
        const timer = setInterval(() => {
        setTimeLeft((prev) => {
            const newState = {...prev};
            Object.keys(newState).forEach((id) => {
            if (newState[id] > 0) newState[id] -= 1;
            });
            return newState;
        });
        }, 1000);
         return () => clearInterval(timer);            
        }, []);

        const isGuru = role?.toUpperCase() === 'GURU';
        const isSiswa = role?.toUpperCase() === 'SISWA';

        if (activeQuizId) {
            return (
                <QuizRoom 
                    quizId={activeQuizId}
                    onLeave={() => setActiveQuizId(null)}
                />
            );
        }

        return (
            <div className="flex flex-col xl:flex-row h-full w-full bg-[#B2A4D4] p-4 md:p-6 gap-6 overflow-y-auto xl:overflow-hidden font-sans">
                <div className="flex-3 flex flex-col bg-[#F3F3F3] rounded-[30px] md:rounded-[40px] shadow-xl p-5 md:p-8 border border-white/20">

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 uppercase leading-none">
                        {isGuru ? "MANAJEMEN KUIS" : "KUIS TERSEDIA"}
                    </h1>

                    {isGuru && (
                        <button
                            onClick={openKuisModal}
                            className="w-full sm:w-auto bg-[#5DADE2] text-white px-6 py-3 rounded-xl md:rounded-2xl font-bold uppercase text-xs md:text-sm tracking-wider shadow-md active:scale-95 transition-all hover:bg-blue-600"
                        >
                            + BUAT KUIS BARU
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 overflow-y-visible xl:overflow-y-auto pr-0 xl:pr-2 pb-4 custom-scrollbar">
                    {kuisAktif.length > 0 ? (
                        kuisAktif.map((quiz) => {
                            const secondsRemaining = timeLeft[quiz.id] || 0;
                            if (secondsRemaining <= 0) return null;

                            const mins = Math.floor(secondsRemaining / 60);
                            const secs = secondsRemaining % 60;

                            return (
                                <div key={quiz.id} className="bg-white p-5 md:p-6 rounded-[25px] md:rounded-[30px] shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col justify-between">
                                    <div>
                                        <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight leading-tight">
                                            {quiz.title}
                                        </h2>
                                        <div className="mt-3 flex flex-wrap gap-3 text-[9px] md:text-[10px] font-bold uppercase tracking-widest">
                                            <span className="text-gray-400">📝 {quiz.totalQuestions} Butir Soal</span>
                                            <span className={`px-2 py-1 rounded-lg border ${secondsRemaining < 20 ? 'text-red-500 border-red-200 bg-red-50 animate-pulse' : 'text-blue-500 border-blue-100 bg-blue-50'}`}>
                                                ⏳ SISA: {mins}:{secs < 10 ? `0${secs}` : secs}    
                                            </span>
                                        </div>
                                    </div>

                                    {isSiswa && (
                                        <button
                                            onClick={() => setActiveQuizId(quiz.id)}
                                            className="mt-5 w-full py-3 rounded-xl md:rounded-2xl font-black uppercase text-xs md:text-sm tracking-tighter transition-all active:scale-[0.98] bg-[#5DADE2] text-white shadow-md hover:bg-blue-600"
                                        >
                                            MULAI KUIS
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 rounded-[30px]">
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Belum ada paket kuis aktif.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full xl:w-75 flex flex-col gap-4 md:gap-5 font-sans">
                <div className="bg-white/30 backdrop-blur-sm p-4 rounded-2xl border border-white/40">
                    <h2 className="text-sm font-black tracking-[0.2em] uppercase text-center text-slate-900">
                        STATISTIK BELAJAR
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-4">
                    {[
                        {label: "TOTAL KUIS", val: stats.totalKuis},
                        {label: "RATA-RATA NILAI", val:stats.rataNilai},
                        {label: "RATA-RATA WAKTU", val: stats.rataWaktu, unit: "dtk"}
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-4 md:p-6 rounded-[25px] md:rounded-[30px] shadow-sm flex flex-col items-center justify-center border border-gray-50">
                            <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-center">{stat.label}</p>
                            <p className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter">
                                {stat.val}{stat.unit && <span className="text-xs ml-1 text-gray-400 font-bold uppercase">{stat.unit}</span>}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-auto bg-[#2C3E50]/90 p-5 rounded-[25px] md:rounded-[30px] text-white shadow-lg border-l-8 border-yellow-500">
                    <p className="font-bold text-[10px] uppercase mb-2 text-yellow-400 flex items-center gap-2">
                        <span className="text-sm">💡</span> PENTING:
                    </p>
                    <p className="text-[9px] md:text-[10px] leading-relaxed opacity-90 uppercase font-bold">
                        SAAT MENGIKUTI KUIS JANGAN REFRESH ATAU KELUAR! NILAI TIDAK AKAN TERSIMPAN.
                    </p>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-999 flex items-center justify-center p-4">
                    <div className="bg-[#B2A4D4] w-full max-w-2xl rounded-[30px] border-4 border-black p-6 md:p-8 relative shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[90vh]">

                        <button onClick={resetModal} className="absolute top-4 right-6 font-black text-2xl hover:text-red-600 transition-colors">✕</button>

                        <h2 className="text-2xl md:text-4xl font-black text-center mb-8 tracking-tighter uppercase leading-none">
                            {step === 1 ? "SETUP KUIS" : "PILIH SOAL"}
                        </h2>

                        <div className="overflow-y-auto pr-2 custom-scrollbar">
                            {step === 1 ? (
                                <div className="flex flex-col gap-6 text-left">
                                    <div className="bg-[#3498DB] border-4 border-black rounded-2xl p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-white">
                                        <label className="font-black text-[10px] uppercase tracking-[0.2em] mb-2 block text-left">Judul Paket Kuis</label>
                                        <input value={judulKuis} onChange={(e) => setJudulKuis(e.target.value)} type="text" className="w-full bg-white border-4 border-black rounded-xl p-3 font-black text-black outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase" placeholder="CONTOH: KUIS PERKALIAN DASAR" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                                        <div className="bg-[#F1C40F] border-4 border-black rounded-2xl p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                            <label className="font-black text-[10px] uppercase tracking-[0.2em] mb-2 block text-black">Target Kelas</label>
                                            <select value={idKelasTerpilih} onChange={(e) => setIdKelasTerpilih(e.target.value)} className="w-full bg-white border-4 border-black rounded-xl p-3 font-black text-black outline-none appearance-none cursor-pointer">
                                                {daftarKelas.map (k => <option key={k.id} value={k.id}>{k.NAMA_KELAS}</option>)}
                                            </select>
                                        </div>
                                        <div className="bg-[#E67E22] border-4 border-black rounded-2xl p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-white">
                                            <label className="font-black text-[10px] uppercase tracking-[0.2em] mb-2 block">Waktu (Menit)</label>
                                            <input 
                                                value={durasiKuis} 
                                                onChange={(e) => {
                                                    const inputVal = e.target.value;
                                                    if (inputVal === "") {
                                                        setDurasiKuis("");
                                                        return;
                                                    }
                                                    const val = parseInt(inputVal);
                                                    setDurasiKuis(isNaN(val) || val < 1 ? 1 : val);
                                                }}
                                                type="number" min="1" 
                                                className="w-full bg-white border-4 border-black rounded-xl p-3 font-black text-black outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" placeholder="15" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4 min-h-112.5 text-left">
                                    <div className="bg-[#9B59B6] border-4 border-black rounded-2xl p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-white">
                                        <label className="font-black text-[10px] uppercase tracking-[0.2em] mb-3 block">Generate Soal Otomatis</label>
                                        <div className="flex flex-wrap gap-3">
                                            <select id="diff" className="flex-1 bg-white border-2 border-black rounded-xl p-2 font-black text-black text-[10px] uppercase outline-none min-w-37.5">
                                                <option value="CAMPUR">CAMPUR</option>
                                                <option value="MUDAH">MUDAH</option>
                                                <option value="SEDANG">SEDANG</option>
                                                <option value="SULIT">SULIT</option>
                                            </select>

                                            <select id="oper" className="flex-1 bg-white border-2 border-black rounded-xl p-2 font-black text-black text-[10px] uppercase outline-none min-w-37.5">
                                                <option value="SEMUA">SEMUA OPERASI</option>
                                                <option value="+">TAMBAH (+)</option>
                                                <option value="-">KURANG (-)</option>
                                                <option value="x">KALI (×)</option>
                                                <option value="/">BAGI (÷)</option>
                                            </select>

                                            <button onClick={() => handleGenerate(document.getElementById('diff').value, document.getElementById('oper').value)} className="bg-[#2ECC71] border-2 border-black px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition-all">GENERATE</button>
                                            <button onClick={() => setSelectedSoal([])} className="bg-red-500 border-2 border-black px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition-all text-white">RESET</button>
                                        </div>
                                    </div>

                                    <div className="bg-white border-4 border-black p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center">
                                        <div>
                                            <p className="font-black uppercase text-[9px] text-gray-400 leading-none mb-1">NILAI MAKSIMAL</p>
                                            <p className={`text-2xl font-black tracking-tighter uppercase ${totalBobot === 100 ? 'text-green-600' : 'text-red-600'}`}>
                                                {totalBobot} / 100
                                            </p>
                                        </div>
                                        <div className="text-right text-gray-400">
                                            <p className="font-black uppercase text-[9px] leading-none mb-1 text-center">Pilih Soal</p>
                                            <select onChange={(e) => {
                                                const s = allSoal.find(x => x.id === e.target.value);
                                                if(s) {
                                                    setSelectedSoal([...selectedSoal, {ID_SOAL: s.id, NOMOR_SOAL: selectedSoal.length + 1, BOBOT_NILAI: 0, PREVIEW: `${s.ANGKA_1} ${s.OPERASI} ${s.ANGKA_2 }`, TINGKAT: s.TINGKAT_KESULITAN }]);
                                                }
                                            }} className="bg-gray-100 border-2 border-black rounded-lg text-[10px] font-black p-1 w-full uppercase outline-none">
                                                <option value="">+ TAMBAH SOAL</option>
                                                {allSoal.filter(x => !selectedSoal.some(sel => sel.ID_SOAL === x.id)).map(s => (
                                                    <option key={s.id} value={s.id}>{s.ANGKA_1} {s.OPERASI} {s.ANGKA_2}</option>
                                                ))}    
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        {selectedSoal.map((soal, index) => (
                                            <div key={index} className="bg-white border-[3px] md:border-4 border-black p-3 md:p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 md:gap-4">
                                                <div className="w-8 h-8 md:w-10 md:h-10 bg-black text-white rounded-lg flex items-center justify-center font-black shrink-0 text-xs md:text-base">{index + 1}</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1 md:gap-2 mb-0.5 md:mb-1">
                                                        <span className="text-[7px] md:text-[8px] font-black px-1.5 py-0.5 rounded border border-black text-white bg-blue-500 uppercase">{soal.TINGKAT}</span>
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase leading-none">ID:{soal.ID_SOAL.substring(0,5)}</span>
                                                    </div>
                                                    <p className="text-[11px] md:text-sm font-black uppercase leading-tight truncate">{soal.PREVIEW} = ?</p>
                                                </div>
                                                <div className="w-12 md:w-16 shrink-0">
                                                    <label className="text-[6px] md:text-[7px] font-black uppercase block mb-1 text-center text-gray-400">Bobot</label>
                                                    <input type="number" value={soal.BOBOT_NILAI === 0 ? "" : soal.BOBOT_NILAI} onChange={(e) => {
                                                        const cp = [...selectedSoal];
                                                        const inputVal = e.target.value;

                                                        if(inputVal === ""){
                                                            cp[index].BOBOT_NILAI = 0;
                                                        } else {
                                                            const val = parseInt(inputVal);
                                                            cp[index].BOBOT_NILAI = val < 0 ? 0 : val;
                                                        }
                                                        setSelectedSoal(cp);
                                                    }} placeholder="0" className="w-full border-2 border-black rounded-lg p-1 text-center font-black text-[10px] md:text-xs outline-none bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
                                                </div>
                                                <button onClick={() => handleHapusSoal(soal.ID_SOAL)} className="text-gray-300 hover:text-red-600 font-black p-1 transition-colors text-sm md:text-base">✕</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}                         
                        </div>

                        <div className="mt-8 flex gap-4">
                            {step === 2 && (
                                <button onClick={() => setStep(1)} className="flex-1 bg-gray-200 border-4 border-black py-4 rounded-2xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 transition-all uppercase text-sm">KEMBALI</button>
                            )}
                            <button
                                onClick={() => step === 1 ? handleNextStep() : handleSimpanFinal()}
                                disabled={loading}
                                className={`flex-2 py-4 rounded-2xl font-black text-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 transition-all uppercase border-4 border-black ${step === 1 ? 'bg-[#2ECC71] text-white' : 'bg-[#F1C40F] text-black'}`}
                            >
                                {step === 1 ? "LANJUT PILIH SOAL →" : "SIMPAN PAKET KUIS"}
                            </button>                           
                        </div>
                    </div>
                </div>
            )}        
        </div>
    );

};

export default KuisMainContent;