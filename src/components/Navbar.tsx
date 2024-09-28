import React, { useEffect, useState } from 'react';
import { navigate } from 'gatsby';
import { getCurrentUser, signOutUser, deleteUserAuth, User } from '../utils/firebase';

const Navbar: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const currentUser = await getCurrentUser();
            setUser((prevUser) => currentUser || prevUser);
        };

        fetchUser();
    }, []);

    const handleLogout = async () => {
        try {
            await signOutUser();
            navigate('/auth');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            try {
                await deleteUserAuth();
                alert('Account deleted successfully. You will be logged out.');
                navigate('/auth');
            } catch (error) {
                console.error('Error deleting account:', error);
                alert('An error occurred while deleting the account. Please try again.');
            }
        }
    };

    return (
        <nav className="bg-gray-800 p-4">
            <div className="container mx-auto flex justify-between items-center">
                <div className="text-white font-semibold">{user?.name || 'User'}</div>
                <div>
                    <button
                        onClick={handleLogout}
                        className="text-white mr-4 hover:text-gray-300"
                    >
                        Logout
                    </button>
                    <button
                        onClick={handleDeleteAccount}
                        className="text-red-500 hover:text-red-300"
                    >
                        Delete Account
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;