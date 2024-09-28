import React, { useEffect } from "react";
import { navigate } from "gatsby";
import { signOutUser } from "../utils/firebase";

const LogoutPage: React.FC = () => {
    useEffect(() => {
        const handleLogout = async () => {
            try {
                await signOutUser();
                navigate("/auth");
            } catch (error) {
                console.error("Error logging out:", error);
            }
        };

        handleLogout();
    }, []);

    return <div>Logging out...</div>;
};

export default LogoutPage;