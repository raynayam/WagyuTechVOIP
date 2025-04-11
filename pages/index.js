import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Auth() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const toggleForm = () => {
    setIsSignIn(!isSignIn);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // This would normally connect to your authentication API
    // For now, we'll just simulate a successful login
    setTimeout(() => {
      setIsLoading(false);
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d946ef] to-[#10b981] flex items-center justify-center p-4">
      <Head>
        <title>{isSignIn ? 'Sign In' : 'Sign Up'} - VoIP App</title>
        <meta name="description" content="VoIP application authentication page" />
      </Head>
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-[#d946ef]">
              {isSignIn ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-[#10b981] mt-2 font-medium">
              {isSignIn 
                ? 'Sign in to continue to VoIP App' 
                : 'Sign up to start using VoIP App'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {!isSignIn && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-[#10b981] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d946ef] focus:border-transparent"
                  placeholder="John Doe"
                  required={!isSignIn}
                />
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-[#10b981] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d946ef] focus:border-transparent"
                placeholder="you@example.com"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-[#10b981] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d946ef] focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#d946ef] to-[#10b981] text-white p-3 rounded-lg font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#d946ef] focus:ring-offset-2 transition-all shadow-lg disabled:opacity-70 text-lg"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                isSignIn ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>
          
          <div className="text-center mt-6">
            <button 
              onClick={toggleForm}
              className="text-[#d946ef] hover:text-[#10b981] font-medium transition-colors"
            >
              {isSignIn ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>
          
          {isSignIn && (
            <div className="text-center mt-4">
              <a href="#" className="text-sm text-gray-600 hover:text-[#d946ef] transition-colors">
                Forgot your password?
              </a>
            </div>
          )}
        </div>
        
        <div className="px-8 py-4 bg-gradient-to-r from-[#10b981]/10 to-[#d946ef]/10 border-t border-[#10b981]/20 text-center text-sm text-gray-600">
          By using this service, you agree to our{' '}
          <a href="#" className="text-[#10b981] hover:text-[#d946ef] transition-colors">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-[#10b981] hover:text-[#d946ef] transition-colors">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
} 