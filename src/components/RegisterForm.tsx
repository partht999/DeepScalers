import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiLock, FiArrowRight, FiArrowLeft } from 'react-icons/fi';

interface RegisterFormProps {
  phone: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ phone, onSuccess, onCancel }) => {
  const { register, loading, error } = useAuth();
  
  const [formData, setFormData] = useState({
    phone_number: phone,
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    email: '',
  });
  
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Validate form data
    if (!formData.phone_number) {
      setFormError('Phone number is required');
      return;
    }
    
    if (!formData.password) {
      setFormError('Password is required');
      return;
    }
    
    if (formData.password !== formData.confirm_password) {
      setFormError('Passwords do not match');
      return;
    }
    
    try {
      // Register the user
      await register({
        phone_number: formData.phone_number,
        password: formData.password,
        first_name: formData.first_name || undefined,
        last_name: formData.last_name || undefined,
        email: formData.email || undefined,
      });
      
      // Call onSuccess callback on successful registration
      onSuccess();
    } catch (error) {
      // Error is already set in the auth context
      console.error('Registration error:', error);
    }
  };
  
  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border-l-4 border-red-500 dark:border-red-500">
          <p className="text-sm font-medium text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}
      
      {formError && (
        <div className="mb-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 p-4 border-l-4 border-amber-500 dark:border-amber-500">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-400">{formError}</p>
        </div>
      )}
      
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phone Number
          </label>
          <input
            id="phone_number"
            name="phone_number"
            type="tel"
            required
            className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-all duration-200"
            value={formData.phone_number}
            onChange={handleChange}
            readOnly
            disabled
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              First Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 dark:text-gray-500">
                <FiUser size={18} />
              </div>
              <input
                id="first_name"
                name="first_name"
                type="text"
                className="pl-10 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-all duration-200"
                placeholder="First name"
                value={formData.first_name}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Last Name
            </label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-all duration-200"
              placeholder="Last name"
              value={formData.last_name}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email (optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 dark:text-gray-500">
              <FiMail size={18} />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              className="pl-10 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-all duration-200"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 dark:text-gray-500">
              <FiLock size={18} />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="pl-10 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-all duration-200"
              placeholder="Create a secure password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 dark:text-gray-500">
              <FiLock size={18} />
            </div>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              required
              className="pl-10 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-all duration-200"
              placeholder="Confirm your password"
              value={formData.confirm_password}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex justify-between space-x-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 flex items-center justify-center py-3 px-4 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors duration-200 group"
          >
            <FiArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform duration-200" size={16} />
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group"
          >
            <span className="flex items-center">
              {loading ? 'Registering...' : 'Complete Registration'}
              <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform duration-200" size={16} />
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm; 