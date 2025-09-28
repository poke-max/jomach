import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginForm = () => {
  const { loginWithGoogle, login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h2>
      
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full bg-[#FF4438] text-white py-2 px-4 rounded hover:bg-[#FF4438] disabled:opacity-50"
      >
        {loading ? 'Iniciando...' : 'Continuar con Google'}
      </button>
    </div>
  );
};

const MyComponent = () => {
  const { currentUser, loginWithGoogle, logout } = useAuth();

  if (currentUser) {
    return (
      <div>
        <p>Bienvenido, {currentUser.displayName}</p>
        <button onClick={logout}>Cerrar Sesión</button>
      </div>
    );
  }

  return <LoginForm />;
};

export default MyComponent;
