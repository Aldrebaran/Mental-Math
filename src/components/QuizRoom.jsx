import React, { useState, useEffect, useCallback, useRef } from "react";
import { db, auth } from "../lib/Firebase";
import { collection, doc, getDoc, getDocs, query, where, addDoc, serverTimestamp } from "firebase/firestore";

const QuizRoom = ({ quizId, onLeave }) => {
    
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [timeLeftPerSoal, setTimeLeftPerSoal] = useState(30);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [namaAsli, setNamaAsli] = useState("");

    const nextActionRef = useRef();

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const user = auth.currentUser;
                if (user) {

                    const checkQuery = query(
                        collection(db, "HASIL_KUIS"),
                        where("ID_KUIS", "==", quizId),
                        where("ID_SISWA", "==", user.uid)
                    );
                    const checkSnap = await getDocs(checkQuery);

                    if (!checkSnap.empty) {
                        alert("Maaf, kamu sudah mengerjakan kuis ini!");
                        onLeave();
                        return;
                    }

                    const docRef = doc(db, "SISWA", user.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const dataSiswa = docSnap.data();
                        setNamaAsli(dataSiswa.NAMA_SISWA || "");
                        console.log("Nama berhasil diambil:", dataSiswa.NAMA_SISWA);
                    } else {
                        console.log("Dokumen siswa tidak ditemukan di Firestore!");
                    }
                }
        
                const detailQuery = query(collection(db, "DETAIL_KUIS"), where ("ID_KUIS", "==", quizId));
                const detailSnap = await getDocs(detailQuery);
                const listDetail = detailSnap.docs.map(d => ({id: d.id, ...d.data() })).sort((a,b) => a.NOMOR_SOAL - b.NOMOR_SOAL);

                const questionPromises = listDetail.map(async (detail) => {
                    const soalDoc = await getDoc(doc(db, "SOAL", detail.ID_SOAL));
                    const sData = soalDoc.data();
                    return {
                        ...detail,
                        teksTampilan: `${sData?.ANGKA_1} ${sData?.OPERASI} ${sData?.ANGKA_2}`,
                        jawabanBenar: sData?.JAWABAN,
                        WAKTU_SOAL: sData?.WAKTU_SOAL
                    };
                });

                const fullQuestions = await Promise.all(questionPromises);
                setQuestions(fullQuestions);
            } catch (error) {
                console.error("Error Mengambil Paket Kuis:", error);
                alert("Gagal Mengambil Data Kuis!");
                onLeave();
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [quizId, onLeave]);

    const handleSubmitFinal = useCallback (async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        const user = auth.currentUser;

        try {
            let totalSkor = 0;
            let jumlahBenar = 0;
            let totalWaktuKuis = 0;

            const detailJawabanSiswa = [];

            questions.forEach((q) => {
                totalWaktuKuis += Number(q.WAKTU_SOAL || 0);

                const jawabanUser = userAnswers[q.ID_SOAL] || "";
                const isCorrect = String(jawabanUser).trim() === String(q.jawabanBenar).trim();

                if (isCorrect) {
                    totalSkor += Number(q.BOBOT_NILAI);
                    jumlahBenar++;
                }

                detailJawabanSiswa.push({
                    ID_SOAL: q.ID_SOAL,
                    JAWABAN_USER: String(jawabanUser),
                    NOMOR_SOAL: Number(q.NOMOR_SOAL),
                    STATUS_BENAR: isCorrect
                }); 
            });

            const sisaWaktuTerakhir = Number(timeLeftPerSoal || 0);
            const durasiDetik = Math.max(0, totalWaktuKuis - sisaWaktuTerakhir);

            const menit = Math.floor(durasiDetik / 60);
            const detik = durasiDetik % 60;
            const durasiTampilan = `${menit}:${detik < 10 ? '0' : ''}${detik}`;

            const hasilRef = await addDoc(collection(db, "HASIL_KUIS"), {
                ID_KUIS: quizId,
                ID_SISWA: user.uid,
                NAMA_SISWA: namaAsli || "Siswa Anonim",
                WAKTU_SUBMIT: serverTimestamp(),
                SKOR_AKHIR: Number(totalSkor),
                STATUS: "SELESAI",
                BENAR_STAT: Number(jumlahBenar),
                SALAH_STAT: Number(questions.length - jumlahBenar),
                DURASI_KERJA_DETIK: Number(durasiDetik),
                DURASI_KERJA_TAMPILAN: String(durasiTampilan)
            });

            await Promise.all(detailJawabanSiswa.map(item =>
                addDoc(collection(db, "JAWABAN_SISWA"), {
                    ...item,
                    ID_HASIL_KUIS: hasilRef.id
                })
            ));

            alert(`Kuis Selesai! Skor Anda: ${totalSkor}`);
            onLeave();
        } catch (e) {
            console.error("Error menyimpan hasil:", e);
            alert("Terjadi kesalahan saat menyimpan nilai.");
        } finally {
            setIsSubmitting(false);
        }        
    }, [isSubmitting, questions, userAnswers, quizId, onLeave, namaAsli, timeLeftPerSoal]);

    const handleNext = useCallback (() => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            handleSubmitFinal();
        }
    }, [currentIndex, questions.length, handleSubmitFinal]);

    useEffect(() => {
        nextActionRef.current = handleNext;
    }, [handleNext]);

    const currentDuration = Number(questions[currentIndex]?.WAKTU_SOAL) || 30;

    useEffect(() => {
        if (loading || isSubmitting || questions.length === 0) return;

        const targetTime = Date.now() + (currentDuration * 1000);
        setTimeLeftPerSoal(currentDuration);

        const interval = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, Math.ceil((targetTime - now) / 1000));

            if (remaining <= 0) {
                clearInterval(interval);
                if (nextActionRef.current) nextActionRef.current();
            } else {
                setTimeLeftPerSoal(remaining);
            }
        }, 200);

        return () => clearInterval(interval);      
    }, [currentIndex, loading, isSubmitting, questions.length, currentDuration]);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = "Kuis sedang berlangsung. Jika Anda keluar, progres akan hilang!";
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, []);

    if (loading) return ( <div className="...">LOADING...</div> );
    
    const currentSoal = questions[currentIndex];
    const maxWaktu = Number(currentSoal?.WAKTU_SOAL) || 30;
    const progress = (timeLeftPerSoal / maxWaktu) * 100;

    return (
        <div className="fixed inset-0 bg-[#B2A4D4] z-1000 flex flex-col p-4 md:p-6 font-sans overflow-hidden h-screen">

            <div className="w-full max-w-4xl mx-auto flex justify-between items-center mb-2 md:mb-4 relative z-10">

                <div className="bg-[#F1C40F] border-4 border-black px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl">
                    <p className="font-black uppercase text-xs md:text-lg italic">
                        SOAL {currentIndex + 1} / {questions.length}
                    </p>
                </div>

                <div className="relative w-16 h-16 md:w-24 md:h-24 flex items-center justify-center bg-white border-4 border-black rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90 p-1">
                        <circle cx="50%" cy="50%" r="45%" stroke="#eee" strokeWidth="8" fill="transparent" />
                        <circle 
                            cx="50%" cy="50%" r="45%"
                            stroke="#F1C40F" strokeWidth="8" fill="transparent"
                            strokeDasharray="283"
                            strokeDashoffset={283 - (283 * progress) / 100}
                            style={{ transition: 'stroke-dashoffset 1s linear' }}
                        />
                    </svg>
                    <span className="text-xl md:text-3xl font-black italic">{timeLeftPerSoal}</span>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center py-2 md:py-4 relative z-10 min-h-0">
                <div className="bg-white border-4 border-black p-6 md:p-10 rounded-[30px] md:rounded-[40px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl text-center relative flex flex-col justify-center">

                    <div className="text-[#3498DB] font-black text-xs md:text-sm uppercase tracking-widest mb-4">
                        {currentSoal?.TINGKAT_KESULITAN || "MATH"}
                    </div>
                    
                    <h2 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 md:mb-10 tracking-tighter leading-none italic text-black">
                        {currentSoal?.teksTampilan}
                    </h2>

                    <div className="relative max-w-xs md:max-w-md mx-auto w-full">
                        <input 
                            type="number"
                            inputMode="numeric"
                            autoFocus
                            value={userAnswers[currentSoal?.ID_SOAL] || ""}
                            onChange={(e) => setUserAnswers({...userAnswers, [currentSoal.ID_SOAL]: e.target.value})}
                            onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                            className="w-full bg-white border-4 border-black rounded-2xl p-3 md:p-5 text-3xl md:text-5xl text-center font-black outline-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:translate-y-1 transition-all"
                            placeholder="???"        
                        />
                    </div>

                    <p className="mt-4 md:mt-6 font-black text-gray-400 uppercase text-[10px] tracking-widest animate-pulse">
                        TEKAN ENTER UNTUK LANJUT
                    </p>
                </div>
            </div>

            <div className="flex justify-center pb-2 md:pb-4 relative z-10">
                <button
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className={`w-full md:w-80 border-4 border-black px-6 py-3 md:py-4 rounded-2xl font-black uppercase text-lg md:text-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 transition-all ${
                        currentIndex === questions.length - 1
                        ? 'bg-[#F1C40F] text-black'
                        : 'bg-[#5DADE2] text-white'
                    }`}  
                >
                    {isSubmitting ? (
                        "MENGIRIM..."
                    ) : (
                        <>
                            {currentIndex === questions.length - 1 ? "SELESAI & SIMPAN" : "SOAL BERIKUTNYA →"}
                        </>
                    )}
                </button>
            </div>

            <div className="absolute -bottom-5 -left-5 w-64 h-64 bg-white/10 rounded-full blur-3xl z-0 pointer-events-none"></div>
        </div>
    );
};

export default QuizRoom;
