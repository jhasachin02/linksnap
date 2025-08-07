import { Layout } from './components/Layout';
import { AuthForm } from './components/AuthForm';
import { BookmarksList } from './components/BookmarksList';
import { useAuth } from './hooks';
import ResetPassword from './components/ResetPassword';
import { Routes, Route } from 'react-router-dom';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/reset-password"
        element={
          <Layout>
            <ResetPassword />
          </Layout>
        }
      />
      <Route
        path="*"
        element={
          !user ? (
            <Layout>
              <AuthForm />
            </Layout>
          ) : (
            <Layout>
              <BookmarksList />
            </Layout>
          )
        }
      />
    </Routes>
  );
}

export default App;