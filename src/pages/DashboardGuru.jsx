import React, { useState, useEffect } from "react";
import { auth, db } from "../lib/Firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const DashboardGuru = () => {
    const [userData, setUserData] = useState(null);

    useEffect (() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user){
                const docRef = doc(db, "GURU", user.uid);
                const docSnap = await getDoc (docRef);
                if (docSnap.exists()) {
                    setUserData(docSnap.data());
                }
            }
        });
        return () => unsubscribe();
    }, []);

    const formatNama = (namaLengkap) => {
        if (!namaLengkap) return "Memuat...";
        const namaBersih = namaLengkap.trim().split(/\s+/);
        if (namaBersih.length <= 1) return namaLengkap;

        const namaDepan = namaBersih[0];
        const namaBelakang = namaBersih[namaBersih.length -1];
        return `${namaDepan} ${namaBelakang}`;
    };

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="bg-[#d9d9d9] p-8 md:p-12 rounded-[50px] shadow-2xl text-center w-full max-w-sm border border-gray-300">
                <h2 className="text-xl md:text-2xl font-black text-black leading-tight uppercase mb-6">Profil Saya</h2>

                <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full mx-auto mb-8 flex items-center justify-center border-4 border-gray-100 shadow-xl overflow-hidden">
                    <span className="text-4xl md:text-5xl text-white">👤</span>
                </div>

                <div className="space-y-4 text-left">
                    
                    <div className="bg-white/50 p-4 rounded-2xl border border-white/30 text-center">
                        <p className="text-[10px] md:text-xs font-medium text-gray-500 uppercase">Nama Lengkap</p>
                        <p className="text-base md:text-lg font-bold text-black uppercase">{formatNama(userData?.NAMA_GURU)}</p>
                </div>

                <div className="bg-white/50 p-4 rounded-2xl border border-white/30 text-center">
                    <p className="text-[10px] md:text-xs font-medium text-gray-500 uppercase">Role</p>
                    <p className="text-base md:text-lg font-bold text-black uppercase">GURU</p>
                </div>
            </div>
        </div>
    </div>
    );
};
        

export default DashboardGuru;

    