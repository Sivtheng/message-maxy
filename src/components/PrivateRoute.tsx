import React, { useEffect, useState } from 'react';
import { navigate } from 'gatsby';
import { getFirebase } from '../utils/firebase-config';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

interface PrivateRouteProps {
    component: React.ComponentType;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ component: Component }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const app = getFirebase();
        if (!app) {
            console.error("Firebase app not initialized");
            return;
        }

        const auth = getAuth(app);
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsAuthenticated(!!user);
            setIsLoading(false);
            if (!user) {
                navigate('/auth');
            }
        });

        return () => unsubscribe();
    }, []);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return isAuthenticated ? <Component /> : null;
};

export default PrivateRoute;