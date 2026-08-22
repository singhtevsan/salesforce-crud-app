import { useState } from "react";
import { logout } from "../services/api";

const LoginButton = ({ user, onLogout }) => {

    const [loading, setLoading] = useState(false);

    function handleLogin() {
        setLoading(true);
        window.location.href = `${import.meta.env.VITE_API_URL}/auth/login`;
    }

    const handleLogout = async () => {
        try {
            await logout();
            onLogout();
        } catch (error) {
            console.error(error);
            alert("Logout failed");
        }
    }

    if (user) {
        return (
            <div className="user-section">

                <span>
                    Logged in as: <strong>{user.name}</strong>
                </span>

                <button
                    onClick={handleLogout}
                    className="logout-button"
                >
                    Logout
                </button>

            </div>
        );
    }

    return (
        <button
            onClick={handleLogin}
            disabled={loading}
            className="login-button"
        >
            {
                loading
                ? "Redirecting..."
                : "Login with Salesforce"
            }
        </button>
    );
};

export default LoginButton;