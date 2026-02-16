import React from 'react';

interface SocialLoginProps {
  onSocialLogin: (provider: string) => void;
  isLoading: boolean;
}

const SocialLogin: React.FC<SocialLoginProps> = ({ onSocialLogin, isLoading }) => {
  return (
    <div className="space-y-3">
      <button
        onClick={() => onSocialLogin('google')}
        disabled={isLoading}
        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
      >
        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M12 5.04c2.17 0 4.1.78 5.63 2.07l4.2-4.2C19.33.44 15.92-.76 12 .18 7.38 1.3 3.55 4.94 2.36 9.52l4.89-1.42C8.08 6.12 9.87 5.04 12 5.04z"
          />
          <path
            fill="#4285F4"
            d="M23.76 12.25c0-.77-.07-1.54-.2-2.29H12v4.34h6.5c-.28 1.46-1.12 2.7-2.39 3.53v2.94h3.87c2.26-2.09 3.57-5.17 3.57-8.52z"
          />
          <path
            fill="#FBBC05"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-2.94c-1.07.72-2.44 1.15-3.87 1.15-2.98 0-5.5-2.01-6.4-4.71L1.9 16l-.39.94C3.49 20.99 7.42 24 12 24z"
          />
          <path
            fill="#34A853"
            d="M5.6 14.59c-.23-.69-.36-1.42-.36-2.18 0-.76.13-1.49.36-2.18v-3.11H1.9C1.36 8.49 1.05 9.95 1.05 11.5c0 1.55.31 3.01.85 4.37l3.7-1.28z"
          />
        </svg>
        Continue with Google
      </button>

      <button
        onClick={() => onSocialLogin('github')}
        disabled={isLoading}
        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
      >
        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
        </svg>
        Continue with GitHub
      </button>

      <button
        onClick={() => onSocialLogin('microsoft')}
        disabled={isLoading}
        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
      >
        <svg className="h-5 w-5 mr-2" viewBox="0 0 23 23">
          <path fill="#f35325" d="M1 1h10v10H1z" />
          <path fill="#81bc06" d="M12 1h10v10H12z" />
          <path fill="#05a6f0" d="M1 12h10v10H1z" />
          <path fill="#ffba08" d="M12 12h10v10H12z" />
        </svg>
        Continue with Microsoft
      </button>
    </div>
  );
};

export default SocialLogin; 