import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { User, Mail, Lock, Key, GraduationCap } from "lucide-react";
import { registerUser } from "../Services/AuthService";
import { collection, getDocs } from "firebase/firestore";   
import { db } from "../lib/Firebase";   

const Register = () => {

    const navigate = useNavigate();

    const [role, setRole] = useState('SISWA');
    const [nama, setNama] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [kodeRegistrasi, setKodeRegistrasi] = useState("");
    const [idKelas, setIdKelas] = useState("");

    const[daftarKelas, setDaftarKelas] = useState([]);

    useEffect(() => {
        const fetchKelas = async () => {
            try{

                const querySnapshot = await getDocs(collection(db,"KELAS"));
                const list = querySnapshot.docs.map(doc =>({
                    id: doc.id,
                    ...doc.data()
                }));
                setDaftarKelas(list);
            } catch (err) {
                console.error("Gagal Mengambil Daftar Kelas", err);
            }
        };

        fetchKelas();
    },  []);
    

    const handleSubmit = async (e) => {
        e.preventDefault();

        if(password !== confirmPassword){
            alert("Konfirmasi password tidak cocok!");
            return;
        }

        if(role === "SISWA" && !idKelas){
            alert("Silakan pilih kelas!");
            return;
        }

        try{
            const userData = {nama, email, password, kodeinput: kodeRegistrasi, ID_KELAS: idKelas};

            await registerUser(role, userData);
            alert("Registrasi berhasil!");
            navigate("/login");
        }
        catch (err){
            alert(err.message);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#B4AEE8] items-center justify-center p-4">
            <div className="w-full max-w-6xl flex flex-col md:flex-row bg-[#B4AEE8] rounded-[40px] overflow-hidden shadow-2xl">

                <div className="hidden md:flex md:w-1/2 flex-col items-center justify-center p-8 bg-[#B4AEE8]">
                    <h2 className="text-2xl font-bold text-[#4A4E69] mb-6 tracking-widest uppercase">GABUNG SEKARANG!</h2>
                    <img
                        src="/img/register-illustration.png"
                        alt="Register Illustration"
                        className="max-w-full max-h-96 object-contain bg-transparent"
                    />
                </div>

            <div className="w-full md:w-1/2 bg-[#E5E7EB] rounded-t-[40px] md:rounded-l-[40px] md:rounded-tr-none p-6 md:p-10 shadow-inner flex flex-col">
                <h2 className="text-2xl font-bold text-center text-[#58A6D8] mb-6 uppercase">BUAT AKUN BARU</h2>

                <div className="flex justify-center gap-4 mb-6">
                    <button
                        type="button"
                        onClick={() => setRole("GURU")}
                        className={`p-4 rounded-2xl bg-white flex flex-col items-center w-32 shadow-md transition-all border-2 ${role === "GURU" ? "border-black scale-105 shadow-lg" : "border-transparent opacity-60"}`}
                    >
                        <img src="/img/role-guru.png" alt="Guru" className="w-16 h-16 mb-2 object-contain"/>
                        <span className="font-bold text-xs">GURU</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole("SISWA")}
                        className={`p-4 rounded-2xl bg-white flex flex-col items-center w-32 shadow-md transition-all border-2 ${role === "SISWA" ? "border-black scale-105 shadow-lg" : "border-transparent opacity-60"}`}
                    >
                        <div className="w-20 h-20 mb-2 overflow-hidden rounded-xl bg-transparent">
                            <img src="/img/role-siswa.png" alt="Siswa" className="w-full h-full object-cover"/>
                        </div>
                        <span className="font-bold text-xs">SISWA</span>
                    </button>
                </div>

                <form className="space-y-2 grow" onSubmit={handleSubmit}>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-4 flex items-center text-gray-500"><User size={14}/></span>
                        <input 
                            type="text"
                            placeholder="Nama Lengkap"
                            className="w-full pl-11 pr-4 py-2 rounded-full bg-[#D1D5DB] outline-none text-xs border-none shadow-inner"
                            value={nama}
                            onChange={(e) => setNama(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <span className="absolute inset-y-0 left-4 flex items-center text-gray-500"><Mail size={14}/></span>
                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full pl-12 pr-4 py-2 rounded-full bg-[#D1D5DB] outline-none text-xs border-none shadow-inner" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)} 
                        />
                    </div>

                    <div className="relative">
                        <span className="absolute inset-y-0 left-4 flex items-center text-gray-500"><Lock size={14}/></span>
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full pl-12 pr-4 py-2 rounded-full bg-[#D1D5DB] outline-none text-xs border-none shadow-inner" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <span className="absolute inset-y-0 left-4 flex items-center text-gray-500"><Lock size={14}/></span>
                        <input
                            type="password"
                            placeholder="Konfirmasi Password"
                            className="w-full pl-12 pr-4 py-2 rounded-full bg-[#D1D5DB] outline-none text-xs border-none shadow-inner" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <span className="absolute inset-y-0 left-4 flex items-center text-gray-500"><Key size={14}/></span>
                        <input
                            type="text"
                            placeholder="Kode Registrasi"
                            className="w-full pl-12 pr-4 py-2 rounded-full bg-[#D1D5DB] outline-none text-xs border-none shadow-inner"
                            value={kodeRegistrasi}
                            onChange={(e) => setKodeRegistrasi(e.target.value)}
                        />
                    </div>

                    {role === "SISWA" && (
                        <div className="relative">
                            <span className="absolute inset-y-0 left-4 flex items-center text-gray-500"><GraduationCap size={14}/></span>
                            <select className="w-full pl-11 pr-4 py-2 rounded-full bg-[#93C5FD] outline-none text-xs border-none shadow-sm cursor-pointer appearance-none"
                                    value={idKelas}
                                    onChange={(e) => setIdKelas(e.target.value)}
                            >
                                    <option value="">Pilih Kelas</option>
                                    {daftarKelas.length > 0 ? (
                                        daftarKelas.map((item) => (
                                            <option key={item.id} value={item.id}>
                                                Kelas {item.NAMA_KELAS} {item.TAHUN_AJARAN ? `(${item.TAHUN_AJARAN})` : ""}
                                            </option>
                                        ))
                                    
                                    ) : (
                                        <option disabled>Kelas Belum Tersedia</option>
                                    )}   
                            </select>
                        </div> 
                    )}

                    <button
                        type="submit"
                        className="w-full bg-[#2998D5] text-white py-2.5 rounded-full font-bold text-lg shadow-lg hover:bg-blue-600 transition-all mt-2 uppercase">
                        Daftar
                    </button>
                </form>

                <p className="text-center mt-3 text-xs font-semibold">
                    Sudah punya akun? <span onClick={() => navigate("/login")} className="text-blue-500 cursor-pointer hover:underline">Login</span>
                </p>
            </div>
        </div>
    </div>
    );  
};
            
export default Register;
