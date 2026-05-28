import { useState, useEffect } from 'react';
import { DatabaseService } from '../supabaseClient';
import { Wedding, Guest } from '../types';
import { Key, Gift, Users, Phone, Notebook, Search, Download, CreditCard, Heart, LogOut, ShieldAlert } from 'lucide-react';
import * as XLSX from 'xlsx';

interface HostViewProps {
  weddings: Wedding[];
}

export default function HostView({ weddings }: HostViewProps) {
  const [isHostLoggedIn, setIsHostLoggedIn] = useState(false);
  const [hostUsername, setHostUsername] = useState('');
  const [hostPassword, setHostPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [myWedding, setMyWedding] = useState<Wedding | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [relationFilter, setRelationFilter] = useState('ទាំងអស់');

  useEffect(() => {
    if (isHostLoggedIn && myWedding) {
      loadMyWeddingGuests();
    }
  }, [isHostLoggedIn, myWedding]);

  const loadMyWeddingGuests = async () => {
    if (myWedding) {
      const data = await DatabaseService.getGuests(myWedding.id);
      setGuests(data);
    }
  };

  const handleHostLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const wedding = await DatabaseService.loginHost(hostUsername, hostPassword);
      if (wedding) {
        setMyWedding(wedding);
        setIsHostLoggedIn(true);
        setLoginError('');
      } else {
        setLoginError('គណនី ឬលេខសម្ងាត់សម្រាប់គូស្នេហ៍មិនត្រឹមត្រូវឡើយ!');
      }
    } catch (err) {
      setLoginError('មានបញ្ហាក្នុងការភ្ជាប់ប្រព័ន្ធ។');
    }
  };

  const handleLogout = () => {
    setIsHostLoggedIn(false);
    setMyWedding(null);
    setGuests([]);
    setHostUsername('');
    setHostPassword('');
  };

  // Statistical Calculations
  // Total Registered Guests (Approved or Pending)
  const totalRegistered = guests.length;

  // Filter approved guests
  const approvedGuests = guests.filter(g => g.status === 'approved');

  // Actual Total Attendees (Approved guests + companions)
  const actualAttendees = approvedGuests.reduce((sum, g) => sum + 1 + g.companions, 0);

  // Total Gift Money Amount ($) - ONLY Approved Guests
  const totalGiftAmount = approvedGuests.reduce((sum, g) => sum + g.amount, 0);

  // Pending verification count
  const pendingCount = guests.filter(g => g.status === 'pending').length;

  // Filter & Search logic for displaying in host table
  const displayedGuests = guests.filter(g => {
    const matchesSearch = 
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      g.phone.includes(searchTerm);
    const matchesRelation = relationFilter === 'ទាំងអស់' || g.relation_type === relationFilter;
    return matchesSearch && matchesRelation;
  });

  // Export to Excel function using SheetJS (xlsx)
  const handleExportToExcel = () => {
    if (guests.length === 0) {
      alert('មិនមានទិន្នន័យដើម្បីនាំចេញឡើយ!');
      return;
    }

    // Format data beautifully for Excel
    const formattedData = guests.map((g, index) => ({
      'ល.រ': index + 1,
      'ឈ្មោះភ្ញៀវ': g.name,
      'លេខទូរស័ព្ទ': g.phone,
      'ចំនួនអ្នករួមដំណើរ': g.companions,
      'សរុបអ្នកចូលរួម': g.status === 'approved' ? g.companions + 1 : 0,
      'ប្រភេទទំនាក់ទំនង': g.relation_type,
      'ទឹកប្រាក់ចងដៃ ($)': g.amount,
      'ស្ថានភាពគណនី': g.status === 'approved' ? 'បានអនុម័ត' : 'រង់ចាំផ្ទៀងផ្ទាត់',
      'ពាក្យជូនពរ/កំណត់សម្គាល់': g.note || '',
      'កាលបរិច្ឆេទចុះឈ្មោះ': g.created_at ? new Date(g.created_at).toLocaleDateString('kh-KH') : ''
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'បញ្ជីឈ្មោះភ្ញៀវមង្គលការ');
    
    // Auto-fit column widths
    const max_len = formattedData.reduce((prev, next) => {
      Object.keys(next).forEach((key, idx) => {
        const val = next[key as keyof typeof next]?.toString() || '';
        prev[idx] = Math.max(prev[idx] || 10, val.length + 4);
      });
      return prev;
    }, [] as number[]);
    
    worksheet['!cols'] = max_len.map(w => ({ wch: w }));

    // Trigger file download
    const fileName = `${myWedding?.title?.replace(/\s+/g, '_')}_GuestList.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  if (!isHostLoggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-12" id="host-login-wrapper">
        <div className="bg-white border border-pink-100 rounded-3xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-r from-pink-500 to-rose-400 rounded-2xl flex items-center justify-center mx-auto text-white shadow-md mb-3">
              <Heart className="w-8 h-8 fill-pink-100" />
            </div>
            <h2 className="text-xl font-serif font-bold text-slate-800">ចលនទិន្នន័យម្ចាស់ដើមការ (Host View)</h2>
            <p className="text-xs text-slate-500 mt-1 font-light">សូមបញ្ចូលគណនីប្រើប្រាស់ដែលផ្ដល់ដោយគណៈចាត់តាំង</p>
          </div>

          <form onSubmit={handleHostLogin} className="space-y-4" id="host-login-form">
            {loginError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl font-medium" id="host-login-error">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">គណនីម្ចាស់ដើមការ (Host Username)</label>
              <input
                type="text"
                required
                value={hostUsername}
                onChange={(e) => setHostUsername(e.target.value)}
                placeholder="ឧ. socheata123"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-pink-500 focus:border-pink-500 p-3 text-sm outline-none"
                id="host-username-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">លេខសម្ងាត់ (Password)</label>
              <input
                type="password"
                required
                value={hostPassword}
                onChange={(e) => setHostPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-pink-500 focus:border-pink-500 p-3 text-sm outline-none"
                id="host-password-input"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 font-bold text-white bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 rounded-xl shadow-md transition cursor-pointer"
              id="host-login-submit-btn"
            >
              ពិនិត្យមើលរបាយការណ៍មង្គលការ
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <span className="text-xs text-slate-400 font-light block">
              គណនីសាកល្បង៖ <span className="font-semibold text-slate-600">socheata123 / password123</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8" id="host-dashboard-container">
      {/* Welcome Board */}
      <div className="bg-gradient-to-r from-pink-600 to-rose-500 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden" id="host-welcome-banner">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 text-white">
            <Heart className="w-8 h-8 fill-pink-50" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-serif font-bold tracking-wide">
              {myWedding?.title}
            </h1>
            <p className="text-pink-100 text-xs mt-1 font-light">
              សូមស្វាគមន៍មកកាន់ប្រព័ន្ធរបាយការណ៍ផ្សាយផ្ទាល់! ទិន្នន័យត្រូវបានកម្រិតត្រឹមការអាន និងពិនិត្រផ្ទាល់តែក៏អាចទាញយកបាន។
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportToExcel}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow transition"
            id="xlsx-export-btn"
          >
            <Download className="w-4 h-4" />
            ទាញយកបញ្ជី Excel (SheetJS)
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-3.5 py-2.5 border border-white/30 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition"
            id="host-logout-btn"
          >
            <LogOut className="w-4 h-4" />
            ចាកចេញ
          </button>
        </div>
      </div>

      {/* Styled Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="host-statistical-cards">
        {/* Card 1: Total Registered Guests */}
        <div className="bg-white border border-pink-100 p-6 rounded-3xl shadow-sm relative overflow-hidden flex items-center gap-4" id="stat-card-registered">
          <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <span className="text-3xs font-extrabold text-slate-400 tracking-wider uppercase block">ភ្ញៀវចុះឈ្មោះសរុប (RSVP Count)</span>
            <span className="text-3xl font-bold text-slate-800 tracking-tight block mt-1">{totalRegistered} នាក់</span>
            {pendingCount > 0 && (
              <span className="text-2xs font-semibold text-amber-500 block">({pendingCount} នាក់កំពុងរង់ចាំការផ្ទៀងផ្ទាត់)</span>
            )}
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-r from-indigo-500/5 to-indigo-500/0 rounded-full blur-xl transform translate-x-4 -translate-y-4"></div>
        </div>

        {/* Card 2: Actual Total Attendees (Approved guests + companions) */}
        <div className="bg-white border border-pink-100 p-6 rounded-3xl shadow-sm relative overflow-hidden flex items-center gap-4" id="stat-card-attendees">
          <div className="p-4 bg-pink-50 rounded-2xl text-pink-600">
            <Heart className="w-8 h-8 fill-pink-100" />
          </div>
          <div>
            <span className="text-3xs font-extrabold text-slate-400 tracking-wider uppercase block">អ្នកមកចូលរួមពិតប្រាកដ (Actual Attendees)</span>
            <span className="text-3xl font-bold text-slate-800 tracking-tight block mt-1">{actualAttendees} នាក់</span>
            <span className="text-2xs text-slate-400 font-light block">គិតត្រឹមភ្ញៀវដែលបានអនុម័ត + ភរិយា/ស្វាមី/កូន</span>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-r from-pink-500/5 to-pink-500/0 rounded-full blur-xl transform translate-x-4 -translate-y-4"></div>
        </div>

        {/* Card 3: Total Gift Money Amount */}
        <div className="bg-white border border-pink-100 p-6 rounded-3xl shadow-sm relative overflow-hidden flex items-center gap-4" id="stat-card-amount">
          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
            <Gift className="w-8 h-8" />
          </div>
          <div>
            <span className="text-3xs font-extrabold text-slate-400 tracking-wider uppercase block">ថវិកាចងដៃសរុប (Total Gift Amount)</span>
            <span className="text-3xl font-extrabold text-emerald-600 tracking-tight block mt-1">
              ${totalGiftAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-2xs text-slate-400 font-light block">គិតតែពីភ្ញៀវដែលបានអនុម័តរួច</span>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-r from-emerald-500/5 to-emerald-500/0 rounded-full blur-xl transform translate-x-4 -translate-y-4"></div>
        </div>
      </div>

      {/* Guest Reports view-only Table */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden" id="host-guest-log-panel">
        <div className="p-5 bg-slate-50/50 border-b border-rose-50 flex flex-col md:flex-row items-center justify-between gap-4">
          <h2 className="text-sm font-serif font-bold text-slate-800 flex items-center gap-2">
            <Notebook className="w-5 h-5 text-pink-500" />
            របាយការណ៍ និងការត្រួតពិនិត្យកំណត់ត្រាភ្ញៀវ ({displayedGuests.length} រកឃើញ)
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-56">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-slate-400" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ស្វែងរកតាមឈ្មោះ ឬលេខទូរស័ព្ទ..."
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:ring-pink-400 focus:border-pink-400"
                id="host-search-input"
              />
            </div>

            {/* Relation Type Filter */}
            <select
              value={relationFilter}
              onChange={(e) => setRelationFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 outline-none w-full sm:w-36 font-semibold"
              id="host-relation-filter"
            >
              <option value="ទាំងអស់">ទំនាក់ទំនងទាំងអស់</option>
              <option value="ខាងកូនកំលោះ">ខាងកូនកំលោះ</option>
              <option value="ខាងកូនក្រមុំ">ខាងកូនក្រមុំ</option>
              <option value="មិត្តភក្តិ">មិត្តភក្តិ</option>
              <option value="ផ្សេងៗ">ផ្សេងៗ</option>
            </select>
          </div>
        </div>

        {displayedGuests.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs font-light">
            មិនមានទិន្នន័យត្រូវគ្នានឹងតម្រង ឬស្វែងរកឡើយ។
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left order-collapse" id="host-guests-table">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 font-bold text-2xs uppercase tracking-wider border-b border-rose-50/50">
                  <th className="p-4 pl-6">ល.រ</th>
                  <th className="p-4">ឈ្មោះភ្ញៀវ</th>
                  <th className="p-4">លេខទូរស័ព្ទ</th>
                  <th className="p-4 text-center">អ្នករួមដំណើរ</th>
                  <th className="p-4">ប្រភេទទំនាក់ទំនង</th>
                  <th className="p-4 text-right">ប្រាក់ចងដៃ</th>
                  <th className="p-4">ស្ថានភាព</th>
                  <th className="p-4 pr-6">ពាក្យជូនពរ/សារ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {displayedGuests.map((g, idx) => (
                  <tr key={g.id} className="hover:bg-pink-50/10">
                    <td className="p-4 pl-6 font-mono font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-4 font-bold text-slate-900">{g.name}</td>
                    <td className="p-4 font-mono font-medium">{g.phone}</td>
                    <td className="p-4 text-center">+{g.companions} នាក់</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-3xs font-semibold ${
                        g.relation_type === 'ខាងកូនកំលោះ' ? 'bg-indigo-50 text-indigo-700' :
                        g.relation_type === 'ខាងកូនក្រមុំ' ? 'bg-pink-50 text-pink-700' :
                        g.relation_type === 'មិត្តភក្តិ' ? 'bg-teal-50 text-teal-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>
                        {g.relation_type}
                      </span>
                    </td>
                    <td className="p-4 text-right font-extrabold text-emerald-600">${g.amount.toFixed(2)}</td>
                    <td className="p-4">
                      {g.status === 'approved' ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1 text-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          បានអនុម័ត
                        </span>
                      ) : (
                        <span className="text-amber-500 font-bold flex items-center gap-1 text-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                          រង់ចាំផ្ទៀងផ្ទាត់
                        </span>
                      )}
                    </td>
                    <td className="p-4 pr-6 max-w-xs text-slate-500 italic font-light truncate" title={g.note}>
                      {g.note || '---'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Permissions Disclaimer */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 flex items-start gap-2.5 text-xs text-slate-500" id="host-view-disclaimer">
        <ShieldAlert className="w-4.5 h-4.5 text-slate-400 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>សេចក្តីបញ្ជាក់លម្អិត៖</strong> លោកអ្នកស្ថិតនៅក្នុងគណនីម្ចាស់ដើមការ (Host View) ដែលមានសិទ្ធត្រឹមតែពិនិត្យ ស្វែងរក ផ្ទៀងផ្ទាត់ និងទាញយកទិន្នន័យ (Export to Excel) តែប៉ុណ្ណោះ។ ដើម្បីកែសម្រួល ឬលុបទិន្នន័យភ្ញៀវណាមួយ សូមទាក់ទងមកខាងគណៈចាត់តាំង ឬក្រុមសម្របសម្រួលបច្ចេកទេស។
        </p>
      </div>
    </div>
  );
}
