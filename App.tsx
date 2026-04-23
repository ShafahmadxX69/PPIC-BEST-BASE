
import React, { useEffect, useState, useCallback } from 'react';
import { fetchDashboardData } from './services/googleSheetService';
import { getAiInsights } from './services/geminiService';
import { DashboardData } from './types';
import Dashboard from './components/Dashboard';

const LIVE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1XoV7020NTZk1kzqn3F2ks3gOVFJ5arr5NVgUdewWPNQ/export?format=csv&gid=1100244896';
const DUMMY_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1-amnAYKkoKKXtZ3rzirg0K9gnD6lUFOqV2hqFf5iPEQ/export?format=csv&gid=552593670';

const App: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<string>("");
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [isDummyMode, setIsDummyMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      const url = isDummyMode ? DUMMY_SHEET_URL : LIVE_SHEET_URL;
      const fetchedData = await fetchDashboardData(url);
      
      setData(fetchedData);
      setError(null);
    } catch (err) {
      console.error('Data loading error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isDummyMode]);

  useEffect(() => {
    loadData();
  }, [loadData, isDummyMode]);

  const handleRefresh = () => {
    loadData(true);
  };

  const toggleDummyMode = () => {
    if (!isDummyMode) {
      // Trying to switch to DUMMY
      if (isAuthenticated) {
        setIsDummyMode(true);
        setInsights("");
      } else {
        setShowPasswordModal(true);
      }
    } else {
      // Switching back to LIVE
      setIsDummyMode(false);
      setInsights("");
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "ULI2026") {
      setIsAuthenticated(true);
      setIsDummyMode(true);
      setShowPasswordModal(false);
      setPasswordInput("");
      setPasswordError(false);
      setInsights("");
    } else {
      setPasswordError(true);
      setTimeout(() => setPasswordError(false), 2000);
    }
  };

  const handleGenerateInsights = async () => {
    if (!data) return;
    setIsGeneratingInsights(true);
    try {
      const result = await getAiInsights(data);
      setInsights(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600 font-medium animate-pulse text-center px-4">
          {isDummyMode ? 'Syncing with Dummy Database...' : 'Loading Production Data...'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-100 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Sync Failed</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={() => loadData()}
              className="w-full bg-slate-800 text-white py-3 rounded-xl font-semibold hover:bg-slate-900 transition-colors"
            >
              Retry Connection
            </button>
            <button 
              onClick={() => setIsDummyMode(true)}
              className="w-full bg-white text-slate-800 border border-slate-200 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
            >
              Try Dummy Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {refreshing && (
        <div className="fixed top-4 right-4 z-[100] bg-white px-4 py-2 rounded-full shadow-lg border border-blue-100 flex items-center gap-3">
          <i className="fas fa-sync-alt animate-spin text-blue-600"></i>
          <span className="text-xs font-bold text-slate-700">Updating...</span>
        </div>
      )}
      {data && (
        <Dashboard 
          data={data} 
          insights={insights} 
          isGeneratingInsights={isGeneratingInsights}
          onGenerateInsights={handleGenerateInsights}
          onRefresh={handleRefresh}
          isDummyMode={isDummyMode}
          onToggleDummyMode={toggleDummyMode}
        />
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-300">
            <div className="bg-slate-900 p-8 text-center relative">
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
              <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                <i className="fas fa-lock"></i>
              </div>
              <h3 className="text-xl font-black text-white">Dummy Access</h3>
              <p className="text-slate-400 text-sm mt-1">Enter password to view dummy data</p>
            </div>
            <form onSubmit={handlePasswordSubmit} className="p-8 space-y-4">
              <div>
                <input 
                  type="password" 
                  autoFocus
                  placeholder="Enter Password"
                  className={`w-full bg-slate-50 border ${passwordError ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200'} rounded-xl px-4 py-3 text-center font-bold tracking-widest focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                />
                {passwordError && (
                  <p className="text-red-500 text-[10px] font-bold text-center mt-2 uppercase tracking-wider">Incorrect Password</p>
                )}
              </div>
              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-black transition-all shadow-lg shadow-blue-200 active:scale-95"
              >
                UNLOCK DASHBOARD
              </button>
              <button 
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="w-full text-slate-400 text-xs font-bold hover:text-slate-600 transition-colors uppercase tracking-widest"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
