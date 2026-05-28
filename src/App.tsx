import { useState, useEffect } from 'react';
import { DatabaseService, isSupabaseConfigured } from './supabaseClient';
import { Wedding } from './types';
import GuestView from './components/GuestView';
import AdminView from './components/AdminView';
import HostView from './components/HostView';
import { Heart, Shield, Users, Gift, AlertTriangle, CheckCircle2, Award, Calendar } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'guest' | 'admin' | 'host'>('guest');
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWeddings = async () => {
    setIsLoading(true);
    try {
      const data = await DatabaseService.getWeddings();
      setWeddings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeddings();
  }, []);

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col font-sans selection:bg-pink-100 selection:text-pink-800" id="app-root">
      {/* Upper Status Bar indicating Supabase Integration state */}
      <div className="bg-slate-900 text-white text-xs py-2 px-4 shadow-inner flex flex-wrap items-center justify-between gap-2" id="platform-status-bar">
        <div className="flex items-center gap-2">
          <Award className="w-4.5 h-4.5 text-pink-400 rotate-12" />
          <span className="font-extrabold tracking-widest uppercase text-3xs">Wedding Guest Registry Ecosystem</span>
        </div>

        <div className="flex items-center gap-2">
          {isSupabaseConfigured ? (
            <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-3xs font-extrabold" id="supabase-success-indicator">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              សមាហរណកម្មជាមួយ SUPABASE៖ បានភ្ជាប់ជោគជ័យ
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full text-3xs font-extrabold" id="supabase-local-indicator">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              ម៉ូដសាកល្បង៖ រក្សាទុកក្នុង LOCAL STORAGE (រួចរាល់សម្រាប់ការសាកល្បងភ្លាមៗ)
            </div>
          )}
        </div>
      </div>

      {/* Main Header / Navigation */}
      <header className="bg-white border-b border-rose-50 sticky top-0 z-50 shadow-sm" id="main-navigation-header">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('guest')} id="logo-brand">
            <div className="w-10 h-10 bg-gradient-to-tr from-pink-500 to-rose-400 rounded-full flex items-center justify-center text-white shadow-sm">
              <Heart className="w-5.5 h-5.5 fill-white/10" />
            </div>
            <div>
              <h1 className="text-base font-serif font-black text-rose-800 tracking-tight leading-none flex items-center gap-1.5">
                មង្គលការឌីជីថល (Digital RSVP)
              </h1>
              <span className="text-3xs text-slate-400 tracking-wider font-bold block mt-0.5">WEDDING MANAGEMENT & REGISTRATION PORTAL</span>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center bg-slate-100 p-1 rounded-xl" id="view-tabs-navigation">
            <button
              onClick={() => setActiveTab('guest')}
              className={`flex items-center gap-1.5 px-4.5 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'guest'
                  ? 'bg-white text-pink-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="tab-guest-view"
            >
              <Users className="w-4 h-4" />
              RSVP ចុះឈ្មោះភ្ញៀវ
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-4.5 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'admin'
                  ? 'bg-white text-pink-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="tab-admin-view"
            >
              <Shield className="w-4 h-4" />
              គណៈចាត់តាំង (Admin)
            </button>
            <button
              onClick={() => setActiveTab('host')}
              className={`flex items-center gap-1.5 px-4.5 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'host'
                  ? 'bg-white text-pink-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="tab-host-view"
            >
              <Heart className="w-4 h-4" />
              ម្ចាស់ដើមការ (Host)
            </button>
          </nav>
        </div>
      </header>

      {/* Main Interactive Screen */}
      <main className="flex-grow py-8" id="view-router-switch-container">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20" id="main-loader">
            <div className="w-10 h-10 border-3 border-pink-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-semibold text-slate-500">កំពុងអានទិន្នន័យប្រព័ន្ធ...</p>
          </div>
        ) : (
          <div id="active-viewport-root">
            {activeTab === 'guest' && (
              <GuestView weddings={weddings} />
            )}
            {activeTab === 'admin' && (
              <AdminView weddings={weddings} onRefreshWeddings={fetchWeddings} />
            )}
            {activeTab === 'host' && (
              <HostView weddings={weddings} />
            )}
          </div>
        )}
      </main>

      {/* Footer Details */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12 text-center text-slate-400 text-xs" id="app-footer">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-light">
            © 2026 មង្គលការឌីជីថល (Digital RSVP). រក្សាសិទ្ធិគ្រប់យ៉ាង។
          </p>
          <div className="flex items-center gap-1.5 text-3xs font-extrabold text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            ប្រព័ន្ធត្រូវបានបង្កើតឡើងប្រកបដោយមនោសញ្ចេតនា និងភាពច្នៃប្រឌិតខ្ពស់
          </div>
        </div>
      </footer>
    </div>
  );
}
