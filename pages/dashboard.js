import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const router = useRouter();
  
  const handleSignOut = () => {
    // In a real app, you would handle sign out logic here
    router.push('/');
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Dashboard - VoIP App</title>
        <meta name="description" content="VoIP application dashboard" />
      </Head>
      
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-indigo-600">VoIP App</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleSignOut}
                className="ml-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-6 flex flex-col items-center justify-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Welcome to VoIP App Dashboard</h2>
            <p className="text-gray-600 text-center max-w-md">
              This is a placeholder dashboard. Normally, this would contain your VoIP application's
              main features and functionality.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
} 