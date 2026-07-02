import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = ({ children, requiredRole }) => {
    const { user } = useContext(AuthContext);
    const isAdmin = user && user.roles && user.roles.some(role => role.name === 'ROLE_ADMIN');

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole === 'ROLE_ADMIN' && !isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default PrivateRoute;