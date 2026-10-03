import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

function Home() {
    return <h1>Trang chủ TAKIVIVU</h1>;
}

function Login() {
    return <h1>Đăng nhập TAKIVIVU</h1>;
}

function Register() {
    return <h1>Đăng ký TAKIVIVU</h1>;
}

function NotFound() {
    return <h1>404 - Không tìm thấy trang</h1>;
}

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<MainLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                </Route>

                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}