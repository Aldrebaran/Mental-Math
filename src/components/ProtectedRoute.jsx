import React, { useState ,useEffect } from "react";
import { Navigate } from "react-router-dom";
import {auth, db} from "../lib/Firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const ProtectedRoute = ({ children, requiredRole }) => {

    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (Currentuser) => {
        if (Currentuser) {
            setUser(Currentuser);

            let userDoc = await getDoc(doc(db, "GURU", Currentuser.uid));
            let currentRole = "GURU";

            if (!userDoc.exists()) {
                userDoc = await getDoc(doc(db, "SISWA", Currentuser.uid));
                currentRole = "SISWA";
            }

            setRole(currentRole);

        } else {
            setUser(null);
            setRole(null); 
        }

        setLoading(false);
    });

    return () => unsubscribe();
}, []);

    if (loading) {
        return <div className="h-screen flex items-center justify-center font-bold">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }      

    if (requiredRole && role !== requiredRole) {
        alert("Anda tidak memiliki akses ke halaman ini!");
        return <Navigate to="/login" />;
        }

    return children;

};


export default ProtectedRoute;