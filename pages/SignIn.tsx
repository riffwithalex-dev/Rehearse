import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SignIn: React.FC = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-2xl mb-4">Sign In</h2>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <label className="block mb-2">
          <div className="text-sm text-gray-700">Email</div>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full border p-2 mt-1" />
        </label>
        <label className="block mb-4">
          <div className="text-sm text-gray-700">Password</div>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" className="w-full border p-2 mt-1" />
        </label>
        <button className="w-full bg-black text-white py-2">Sign In</button>
        <div className="mt-4 text-center text-sm text-gray-600">
          Don’t have an account? <a className="text-black" href="#/signup">Sign up</a>
        </div>
      </form>
    </div>
  );
};

export default SignIn;
