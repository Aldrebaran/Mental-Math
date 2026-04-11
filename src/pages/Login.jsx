import React from "react";
import { loginUser } from "../Services/AuthService";
import { useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff } from "lucide-react";

const Login = () => {

    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [errorEmail, setErrorEmail] = React.useState('');
    const [errorPassword, setErrorPassword] = React.useState('');

    const navigate = useNavigate();

    const handleLogin = async (e) => {

        e.preventDefault();

        setErrorEmail('');
        setErrorPassword('');

        try {

            const userData = await loginUser(email, password);

            if (userData.role === 'GURU') {
                navigate('/DashboardGuru');
            } 
            else if (userData.role === 'SISWA') {
                navigate('/DashboardSiswa');
            }
        }
        catch (err) {

            const errorMsg = err.message.toLowerCase();

            if (errorMsg.includes('invalid-credential') || errorMsg.includes('wrong-password') || errorMsg.includes('user-not-found')) {
                setErrorEmail('Periksa kembali email Anda');
                setErrorPassword('Periksa kembali password Anda');
            }
            
            else {
                alert("Login Gagal: " + err.message);
            }
        }
    };

    return (
        <div className="flex min-h-screen">
            
            <div className="w-full md:w-5/12 bg-[#B4AEE8] flex flex-col justify-center px-12 lg:px-20">
                <div className="max-w-md w-full mx-auto">

                    <h1 className="text-3xl font-bold text-center text-black mb-2">Welcome</h1>
                    <p className="text-center text-gray-700 mb-8 text-sm italic">Login ke akun Anda</p>


                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User size={20} className="text-gray-500" />
                            </div>
                            <input
                                type="email"
                                placeholder="Email"
                                className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white border-none focus:ring-2 focus:ring-purple-600 outline-none shadow-sm text-black ${errorEmail ? 'ring-2 ring-red-500' : ''}`}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            {errorEmail && <p className="text-red-600 text-xs mt-1 ml-1 font-semibold">{errorEmail}</p>}
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock size={20} className="text-gray-500" />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                className={`w-full pl-10 pr-12 py-3 rounded-xl bg-white border-none focus:ring-2 focus:ring-purple-600 outline-none shadow-sm text-black ${errorPassword ? 'ring-2 ring-red-500' : ''}`}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >

                                {showPassword ? <EyeOff size={20} className="text-gray-500" /> : <Eye size={20} className="text-gray-500" />}

                            </button>

                            {errorPassword && <p className="text-red-600 text-xs mt-1 ml-1 font-semibold">{errorPassword}</p>}
                </div>

                        <button
                            type="submit"
                            className="w-full bg-[#8A7CEE] text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition duration-300 shadow-lg mt-4"
                        >
                            Login
                        </button>
                    </form>

                    <div className="text-center mt-6 space-y-2">
                        <p className="text-sm text-black">Belum punya akun <span className="text-blue-600 font-bold cursor-pointer hover:underline" onClick={() => navigate('/Register')}>Daftar</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="hidden md:flex md:w-7/12 bg-white items-center justify-center p-12">
                <img
                    src="/img/login-illustration.jpeg" 
                    alt="Login Illustration"
                    className="max-w-full h-auto rounded-3xl"
                    onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1200";
                    }}
                />
            </div>
        </div>
     );
    }
        
export default Login;



