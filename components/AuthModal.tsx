import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { XIcon, LoaderIcon } from './Icons';

interface AuthModalProps {
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Account created! You can now log in.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded text-gray-500">
            <XIcon />
          </button>
        </div>
        
        <form onSubmit={handleAuth} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 rounded-lg transition-colors flex justify-center items-center"
          >
            {loading ? <LoaderIcon className="w-5 h-5 animate-spin" /> : (isSignUp ? 'Sign Up' : 'Log In')}
          </button>

          <div className="text-center text-sm text-gray-500 mt-4">
            {isSignUp ? 'Already have an account? ' : 'New here? '}
            <button 
              type="button"
              className="text-brand-600 font-semibold hover:underline"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Log In' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;