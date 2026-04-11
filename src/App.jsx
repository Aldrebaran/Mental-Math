import React from "react";
import {BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardGuru from "./pages/DashboardGuru";
import DashboardSiswa from "./pages/DashboardSiswa";
import ProtectedRoute from "./components/ProtectedRoute";
import ManajemenSiswa from "./pages/ManajemenSiswa";
import DashboardLayout from "./components/DashboardLayout";
import BankSoal from "./pages/BankSoal";
import KuisMainContent from "./pages/KuisMainContent";
import RiwayatNilai from "./pages/RiwayatNilai";

function App() {
  return (
    <Router>
      <Routes>
      
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        
        <Route element={<ProtectedRoute requiredRole="GURU"><DashboardLayout role="GURU" /></ProtectedRoute>}>
            <Route path="DashboardGuru" element={<DashboardGuru />} /> 
            <Route path="manajemen-siswa" element={<ManajemenSiswa />} />
            <Route path="bank-soal" element={<BankSoal />} />
            <Route path="kelola-kuis" element={<KuisMainContent role="GURU" />} />
            <Route path="riwayat-nilai-guru" element={<RiwayatNilai />} />
        </Route>

        <Route element={<ProtectedRoute requiredRole={"SISWA"}><DashboardLayout role="SISWA"/></ProtectedRoute>}>
            <Route path="DashboardSiswa" element={<DashboardSiswa />} />
            <Route path="kuis-berlangsung" element={<KuisMainContent role="SISWA" />} />
            <Route path="riwayat-nilai-siswa" element={<RiwayatNilai />} />
        </Route>

        <Route path="*" element={<div className="p-10 font-bold">404 - Halaman Tidak Ditemukan</div>} />

      </Routes>
    </Router> 
  );
}

export default App;