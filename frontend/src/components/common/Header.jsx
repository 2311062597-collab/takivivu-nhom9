import { Link } from "react-router-dom";

export default function Header() {
    return (
        <header>
            <nav>
                <Link to="/">TAKIVIVU</Link>
                {" | "}
                <Link to="/">Trang chủ</Link>
                {" | "}
                <Link to="/login">Đăng nhập</Link>
                {" | "}
                <Link to="/register">Đăng ký</Link>
            </nav>
        </header>
    );
}