import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { name, email, password, confirmPassword } = formData;

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isLogin && password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Login Logic
        const res = await axios.post('/api/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        console.log('Login successful', res.data);
        navigate('/dashboard');
      } else {
        // Signup Logic
        await axios.post('/api/auth/signup', { name, email, password });
        console.log('Signup successful, redirecting to login...');
        setIsLogin(true);
        setFormData({ name: '', email: email, password: '', confirmPassword: '' });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0F19] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-teal-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#131826] border border-white/5 rounded-2xl p-8 shadow-2xl relative z-10">

        {/* Header Section */}
        <div className="border-b border-white/5 pb-6 mb-6">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <span className="text-white text-lg font-black tracking-tighter">AF</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white text-center mb-2">
            {isLogin ? 'Welcome back' : 'Create Account'}
          </h2>
          <p className="text-sm text-gray-400 text-center">
            {isLogin ? 'Sign in to AssetFlow' : 'Join your organization on AssetFlow'}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {error && <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 p-3 rounded-lg text-center">{error}</div>}

          {!isLogin && (
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                type="text"
                name="name"
                value={name}
                onChange={onChange}
                className="w-full bg-white/5 border border-transparent focus:border-indigo-500 text-white rounded-lg p-2.5 text-sm transition-colors outline-none"
                placeholder="Priya Shah"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              {isLogin ? 'Email' : 'Work Email'}
            </label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={onChange}
              className="w-full bg-white/5 border border-transparent focus:border-indigo-500 text-white rounded-lg p-2.5 text-sm transition-colors outline-none"
              placeholder="name@company.com"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Password</label>
              {isLogin && (
                <a href="#" className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot password?
                </a>
              )}
            </div>
            <input
              type="password"
              name="password"
              value={password}
              onChange={onChange}
              className="w-full bg-white/5 border border-transparent focus:border-indigo-500 text-white rounded-lg p-2.5 text-sm transition-colors outline-none"
              placeholder={isLogin ? '••••••••••••' : 'Min. 8 characters'}
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={onChange}
                className="w-full bg-white/5 border border-transparent focus:border-indigo-500 text-white rounded-lg p-2.5 text-sm transition-colors outline-none"
                placeholder="Repeat password"
                required={!isLogin}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer disabled:cursor-not-allowed w-full bg-gradient-to-r from-indigo-500 to-cyan-400 text-white font-bold py-2.5 rounded-lg hover:opacity-90 transition-opacity mt-2 shadow-[0_4px_14px_0_rgba(6,182,212,0.39)] disabled:opacity-50 text-sm"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {isLogin ? (
          <div className="mt-6">
            <div className="flex items-center mb-6">
              <div className="flex-1 border-t border-white/5"></div>
              <span className="px-4 text-[10px] text-gray-500 uppercase tracking-widest font-semibold">New to AssetFlow?</span>
              <div className="flex-1 border-t border-white/5"></div>
            </div>
            <button
              onClick={() => {
                setIsLogin(false);
                setError(null);
                setFormData({ name: '', email: '', password: '', confirmPassword: '' });
              }}
              className="cursor-pointer w-full bg-transparent border border-white/5 text-gray-300 font-semibold py-2.5 rounded-lg hover:bg-white/5 transition-colors text-sm"
            >
              Create Account
            </button>
          </div>
        ) : (
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(true);
                setError(null);
                setFormData({ name: '', email: '', password: '', confirmPassword: '' });
              }}
              className="cursor-pointer text-gray-400 text-[11px] hover:text-white transition-colors group"
            >
              Already have an account? <span className="text-indigo-400 group-hover:text-indigo-300">Sign in &rarr;</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
