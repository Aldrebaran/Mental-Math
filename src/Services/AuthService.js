import { auth, db } from "../lib/Firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

const KODE_GURU = "GURUTHERESIAN";
const KODE_SISWA = "SISWATHERESIAN";

export const registerUser = async (role, userData) =>
{

    const{nama, email, password, kodeinput, ID_KELAS} = userData;
    
    const kodeHarusBenar = role === 'GURU' ? KODE_GURU : KODE_SISWA;

    if (kodeinput !== kodeHarusBenar){

        throw new Error(`Kode Registrasi ${role} salah!`);

    }

    try
    {

        const{user} = await createUserWithEmailAndPassword(auth, email, password);

        if(role == 'GURU'){

            await setDoc(doc(db, "GURU", user.uid), {

                NAMA_GURU: nama,
                EMAIL: email,
                PASSWORD: password,
                KODE_REGISTRASI: kodeinput

            });

        }

        else{

            await setDoc(doc(db, "SISWA", user.uid), {

                NAMA_SISWA: nama,
                EMAIL: email,
                PASSWORD: password,
                ID_KELAS: ID_KELAS,
                KODE_REGISTRASI: kodeinput

            });
        }

        return user;

    }

    catch (error){

        if(error.code === 'auth/email-already-in-use'){
            throw new Error("Email Sudah Terdaftar!");
        }
        throw new Error(error.message);
    }

}; 

export const loginUser = async (email, password) => {

    try{

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        let userDoc = await getDoc(doc(db, "GURU", user.uid));
        let role = "GURU";

        if(!userDoc.exists()){
            userDoc = await getDoc(doc(db, "SISWA", user.uid));
            role = "SISWA";
        }

        if(!userDoc.exists()){
            throw new Error("Data pengguna tidak ditemukan!"); 
        }

        return {

            uid: user.uid,
            role: role,
            ...userDoc.data()

        };
    }

    catch(err){
        throw new Error("Login Gagal: " + err.message);
    }
};

export const logoutUser = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            throw new Error("Logout Gagal: " + error.message);
        }
    };

