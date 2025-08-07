import React from 'react';
import { Moon, Sun, Bookmark, LogOut } from 'lucide-react';
import { useDarkMode, useAuth } from '../hooks';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-all duration-300">
      {user && (
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg">
                  <Bookmark className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  BookmarkAI
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {user.email}
                </span>
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {darkMode ? (
                    <Sun className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Moon className="h-5 w-5 text-gray-600" />
                  )}
                </button>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <LogOut className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
          </div>
        </header>
      )}
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};