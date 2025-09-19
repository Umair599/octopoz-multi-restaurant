import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Restaurant {
  id: string;
  name: string;
  logo_url: string;
  subdomain: string;
}

// Function to get subdomain from hostname
function getSubdomain() {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // For localhost development, subdomain comes before .localhost
  if (hostname.includes('.localhost')) {
    return parts[0] !== 'localhost' ? parts[0] : null;
  }
  
  // For production, subdomain comes before main domain
  if (parts.length > 2) {
    return parts[0];
  }
  
  return null;
}

export default function SubdomainLogin() {
  const subdomain = getSubdomain();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (subdomain) {
      fetchRestaurant();
    }
  }, [subdomain]);

  const fetchRestaurant = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/restaurants/by-subdomain/${subdomain}`);
      if (response.ok) {
        const data = await response.json();
        setRestaurant(data);
      } else {
        setError("Restaurant not found");
      }
    } catch (error) {
      setError("Failed to load restaurant information");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subdomain) return;

    setLoginLoading(true);
    setError("");

    try {
      const response = await fetch(`http://localhost:4000/api/auth/login/${subdomain}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token);
        // Redirect based on role
        if (data.user.role === 'restaurant_admin') {
          navigate('/restaurant');
        } else if (data.user.role === 'restaurant_staff') {
          navigate('/restaurant');
        } else {
          navigate('/');
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/restaurant" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Restaurant Not Found</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          {restaurant?.logo_url && (
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="h-16 w-16 object-cover rounded-lg mx-auto mb-4"
            />
          )}
          <h2 className="text-3xl font-extrabold text-gray-900">
            {restaurant?.name || 'Restaurant'} Admin
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your restaurant admin account
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-sm text-red-600">{error}</div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <div className="mt-6">
              <a
                href="/menu"
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                View Menu
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
