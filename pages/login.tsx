import React, { useEffect, useState, FormEvent } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { useAuth } from '../src/contexts/AuthContext';

const Login: NextPage = () => {
  const { t } = useTranslation('common');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState<'admin' | 'tenant'>('admin');
  const [tenantId, setTenantId] = useState('');
  const [error, setError] = useState('');
  const [allowTenantLogin, setAllowTenantLogin] = useState(false);
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/login')
      .then(res => res.json())
      .then(data => {
        const allow = data.allowTenantLogin === true;
        setAllowTenantLogin(allow);
        if (!allow) {
          setLoginType('admin');
        }
      })
      .catch(() => {
        // Fail closed: only system admin until we know tenants exist
        setAllowTenantLogin(false);
        setLoginType('admin');
      })
      .finally(() => setOptionsLoaded(true));
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    try {
      const effectiveType = allowTenantLogin ? loginType : 'admin';
      const success = await login(
        email,
        password,
        effectiveType,
        effectiveType === 'tenant' ? tenantId : undefined
      );
      if (success) {
        router.push('/');
      }
    } catch (error) {
      console.error('Login failed', error);
      const errorMessage = error instanceof Error ? error.message : t('Invalid email or password');
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {t('Sign in to your account')}
          </h2>
          {optionsLoaded && !allowTenantLogin && (
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              {t('No tenants exist yet. Sign in as System Admin to create a tenant.')}
            </p>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} data-testid="login-form">
          <input type="hidden" name="remember" value="true" />
          
          {/* Login Type Selection — tenant option only when tenants exist */}
          {allowTenantLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('Login Type')}
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="loginType"
                    value="admin"
                    checked={loginType === 'admin'}
                    onChange={(e) => setLoginType(e.target.value as 'admin' | 'tenant')}
                    className="mr-2"
                    data-testid="login-type-admin"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('System Admin')}</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="loginType"
                    value="tenant"
                    checked={loginType === 'tenant'}
                    onChange={(e) => setLoginType(e.target.value as 'admin' | 'tenant')}
                    className="mr-2"
                    data-testid="login-type-tenant"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('Tenant User')}</span>
                </label>
              </div>
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            {/* Tenant ID field (only for tenant login) */}
            {allowTenantLogin && loginType === 'tenant' && (
              <div>
                <label htmlFor="tenant-id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('Tenant ID')}
                </label>
                <input
                  id="tenant-id"
                  name="tenantId"
                  type="text"
                  required={loginType === 'tenant'}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder={t('Enter tenant ID')}
                  value={tenantId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTenantId(e.target.value)}
                  data-testid="login-tenant-id"
                />
              </div>
            )}
            
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('Email address')}
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={t('Email address')}
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                data-testid="login-email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('Password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={t('Password')}
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                data-testid="login-password"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm mt-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3" data-testid="login-error">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              data-testid="login-submit"
            >
              {t('Sign in')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
