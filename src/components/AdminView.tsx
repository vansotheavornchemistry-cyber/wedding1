import { useState, useEffect } from 'react';
import { DatabaseService } from '../supabaseClient';
import { Wedding, Guest, Admin } from '../types';
import { Shield, PlusCircle, Check, Trash2, Search, Heart, UserPlus, Key, Eye, EyeOff, LogOut, CheckCircle2 } from 'lucide-react';

interface AdminViewProps {
  weddings: Wedding[];
  onRefreshWeddings: () => void;
}

export default function AdminView({ weddings, onRefreshWeddings }: AdminViewProps) {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [selectedWeddingId, setSelectedWeddingId] = useState('');
  const [guests, setGuests] = useState<Guest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // New Wedding Form States
  const [newTitle, setNewTitle] = useState('');
  const [newKhqrUrl, setNewKhqrUrl] = useState('');
  const [newHostUsername, setNewHostUsername] = useState('');
  const [newHostPassword, setNewHostPassword] = useState('');
  const [showEventPass, setShowEventPass] = useState(false);
  const [sysMsg, setSysMsg] = useState({ text: '', type: 'success' });

  // Manual Guest Form States
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualCompanions, setManualCompanions] = useState(0);
  const [manualRelation, setManualRelation] = useState('ខាងកូនកំលោះ');
  const [manualAmount, setManualAmount] = useState('');
  const [manualNote, setManualNote] = useState('');

  useEffect(() => {
    if (weddings.length > 0 && !selectedWeddingId) {
      setSelectedWeddingId(weddings[0].id);
    }
  }, [weddings, selectedWeddingId]);

  useEffect(() => {
    if (selectedWeddingId && isAdminLoggedIn) {
      loadGuests();
    }
  }, [selectedWeddingId, isAdminLoggedIn]);

  const loadGuests = async () => {
    const data = await DatabaseService.getGuests(selectedWeddingId);
    setGuests(data);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const admin = await DatabaseService.loginAdmin(adminUsername, adminPassword);
      if (admin) {
        setIsAdminLoggedIn(true);
        setLoginError('');
      } else {
        setLoginError('ឈ្មោះ ឬលេខសម្ងាត់អ្នកគ្រប់គ្រងមិនត្រឹមត្រូវឡើយ!');
      }
    } catch (err) {
      setLoginError('មានបញ្ហាក្នុងការភ្ជាប់ប្រព័ន្ធ។');
    }
  };

  const handleCreateWedding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newHostUsername || !newHostPassword) {
      setSysMsg({ text: 'សូមបញ្ចូលព័ត៌មានដែលត្រូវការទាំងអស់!', type: 'error' });
      return;
    }

    try {
      const payload = {
        title: newTitle,
        host_username: newHostUsername,
        host_password: newHostPassword,
        khqr_img_url: newKhqrUrl || 'https://api-qr.bakong.org.kh/images/khqr_mock.png'
      };
      const result = await DatabaseService.createWedding(payload);
      if (result) {
        setSysMsg({ text: 'បង្កើតកម្មវិធីមង្គលការជោគជ័យ!', type: 'success' });
        // Reset wedding form
        setNewTitle('');
        setNewKhqrUrl('');
        setNewHostUsername('');
        setNewHostPassword('');
        onRefreshWeddings();
        setSelectedWeddingId(result.id);
      } else {
        setSysMsg({ text: 'មិនអាចបង្កើតបានទេ ឈ្មោះម្ចាស់ផ្ទះប្រហែលជាមានរួចហើយ។', type: 'error' });
      }
    } catch (err: any) {
      setSysMsg({ text: 'បរាជ័យ៖ ' + (err.message || 'Error occurred'), type: 'error' });
    }
  };

  const handleAddManualGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualPhone.trim()) {
      alert('សូមបំពេញឈ្មោះ និងលេខទូរស័ព្ទភ្ញៀវ!');
      return;
    }

    try {
      const payload: Omit<Guest, 'id'> = {
        wedding_id: selectedWeddingId,
        name: manualName,
        phone: manualPhone,
        companions: manualCompanions,
        relation_type: manualRelation,
        amount: parseFloat(manualAmount) || 0,
        note: manualNote,
        status: 'approved' // Automatically approved since it was entered by admin
      };

      const result = await DatabaseService.addGuest(payload);
      if (result) {
        // Reset manual form
        setManualName('');
        setManualPhone('');
        setManualCompanions(0);
        setManualRelation('ខាងកូនកំលោះ');
        setManualAmount('');
        setManualNote('');
        loadGuests();
        alert('បន្ថែភ្ញៀវដោយជោគជ័យ!');
      } else {
        alert('មិនអាចបន្ថែមភ្ញៀវបានទេ។');
      }
    } catch (err) {
      alert('មានកំហុសប្រព័ន្ធ!');
    }
  };

  const handleApproveGuest = async (guestId: string) => {
    const success = await DatabaseService.updateGuestStatus(guestId, 'approved');
    if (success) {
      loadGuests();
    } else {
      alert('មិនអាចអនុម័តបានទេ។');
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    if (window.confirm('តើអ្នកពិតជាចង់លុបទិន្នន័យភ្ញៀវនេះមែនទេ?')) {
      const success = await DatabaseService.deleteGuest(guestId);
      if (success) {
        loadGuests();
      } else {
        alert('មិនអាចលុបទិន្នន័យបានទេ។');
      }
    }
  };

  // Filter guests based on search term (name or phone)
  const filteredGuests = guests.filter(guest => {
    const value = searchTerm.toLowerCase();
    return (
      guest.name.toLowerCase().includes(value) ||
      guest.phone.toLowerCase().includes(value)
    );
  });

  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-12" id="admin-login-wrapper">
        <div className="bg-white border border-rose-100 rounded-3xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-r from-pink-500 to-rose-400 rounded-2xl flex items-center justify-center mx-auto text-white shadow-md mb-3">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-serif font-bold text-slate-800">ផ្ទាំងគ្រប់គ្រងអ្នកសម្របសម្រួល (Admin)</h2>
            <p className="text-xs text-slate-500 mt-1">សូមបញ្ចូលគណនីសម្ងាត់អ្នកគ្រប់គ្រងដើម្បីបន្ត</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4" id="admin-login-form">
            {loginError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl font-medium" id="login-error-msg">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">គណនី (Username)</label>
              <input
                type="text"
                required
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="ឧ. admin123"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-pink-500 focus:border-pink-500 p-3 text-sm outline-none"
                id="admin-username-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">លេខសម្ងាត់ (Password)</label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-pink-500 focus:border-pink-500 p-3 text-sm outline-none"
                id="admin-password-input"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 font-bold text-white bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 rounded-xl shadow-md transition cursor-pointer"
              id="admin-login-submit-btn"
            >
              ចូលទៅកាន់ប្រព័ន្ធគ្រប់គ្រង
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <span className="text-xs text-slate-400 font-light">
              គណនីសាកល្បង៖ <span className="font-semibold text-slate-600">admin123 / password123</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8" id="admin-dashboard-container">
      {/* Header Panel with LogOut */}
      <div className="bg-white p-5 rounded-2xl border border-pink-50 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4" id="admin-top-menu">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center text-pink-600">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-serif font-bold text-slate-800">ផ្ទាំងបញ្ជាលម្អិតរបស់អ្នកសម្របសម្រួល</h1>
            <p className="text-3xs text-slate-400 font-medium">WEDDING LOGISTICS COORDINATOR ENVIRONMENT</p>
          </div>
        </div>

        <button
          onClick={() => setIsAdminLoggedIn(false)}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 hover:text-rose-600 transition"
          id="admin-logout-btn"
        >
          <LogOut className="w-4 h-4" />
          ចាកចេញ
        </button>
      </div>

      {sysMsg.text && (
        <div className={`p-4 rounded-xl border flex items-center gap-2 text-sm ${
          sysMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`} id="admin-toast-alert">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{sysMsg.text}</span>
          <button onClick={() => setSysMsg({ text: '', type: 'success' })} className="ml-auto text-xs font-bold underline">បិទ</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Wedding Form (left) */}
        <div className="bg-white border border-pink-100 p-6 rounded-2xl shadow-sm space-y-4 h-fit" id="create-wedding-card">
          <h2 className="text-base font-serif font-bold text-slate-800 border-b border-rose-50 pb-2 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-pink-500" />
            បង្កើតកម្មវិធីមង្គលការថ្មី
          </h2>

          <form onSubmit={handleCreateWedding} className="space-y-4" id="create-wedding-form">
            <div>
              <label className="block text-2xs font-semibold text-slate-700 mb-1">ចំណងជើងកម្មវិធី *</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="ឧ. ពិធីមង្គលការ សុភ័ក្ត្រ និង សុជាតា"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-pink-400 focus:border-pink-400 p-2.5 text-xs outline-none"
                id="new-wedding-title"
              />
            </div>

            <div>
              <label className="block text-2xs font-semibold text-slate-700 mb-1">តំណភ្ជាប់រូបភាព KHQR (ImgBB)</label>
              <input
                type="url"
                value={newKhqrUrl}
                onChange={(e) => setNewKhqrUrl(e.target.value)}
                placeholder="https://i.ibb.co/..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-pink-400 focus:border-pink-400 p-2.5 text-xs outline-none"
                id="new-wedding-khqr"
              />
            </div>

            <div>
              <label className="block text-2xs font-semibold text-slate-700 mb-1">គណនីម្ចាស់ដើមការ (Host Username) *</label>
              <input
                type="text"
                required
                value={newHostUsername}
                onChange={(e) => setNewHostUsername(e.target.value)}
                placeholder="សរសេរអក្សរឡាតាំង ឧ. socheata123"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-pink-400 focus:border-pink-400 p-2.5 text-xs outline-none"
                id="new-wedding-host-user"
              />
            </div>

            <div>
              <label className="block text-2xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>លេខសម្ងាត់ម្ចាស់ដើមការ *</span>
                <button
                  type="button"
                  onClick={() => setShowEventPass(!showEventPass)}
                  className="text-pink-500 text-3xs font-bold focus:outline-none flex items-center gap-1"
                >
                  {showEventPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showEventPass ? 'លាក់' : 'បង្ហាញ'}
                </button>
              </label>
              <input
                type={showEventPass ? "text" : "password"}
                required
                value={newHostPassword}
                onChange={(e) => setNewHostPassword(e.target.value)}
                placeholder="ឧ. password123"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-pink-400 focus:border-pink-400 p-2.5 text-xs outline-none"
                id="new-wedding-host-pass"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 text-xs font-bold text-white bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 rounded-xl transition shadow flex items-center justify-center gap-1.5"
              id="create-wedding-submit"
            >
              <PlusCircle className="w-4 h-4" />
              បង្កើតកម្មវិធីមង្គលការ
            </button>
          </form>
        </div>

        {/* Manual Guest Insertion & Guest Table (right) */}
        <div className="lg:col-span-2 space-y-6" id="admin-guest-management-panel">
          {/* Active Wedding switch & manual guest adder */}
          <div className="bg-white p-6 border border-pink-100 rounded-2xl shadow-sm space-y-6" id="main-admin-selector">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                <span className="font-serif font-bold text-slate-800">ជ្រើសរើសកម្មវិធីកំពុងគ្រប់គ្រង៖</span>
              </div>
              <select
                value={selectedWeddingId}
                onChange={(e) => setSelectedWeddingId(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg focus:ring-pink-500 focus:border-pink-500 p-2 outline-none w-full sm:w-64"
                id="admin-wedding-dropdown"
              >
                {weddings.map((w) => (
                  <option key={w.id} value={w.id}>{w.title}</option>
                ))}
              </select>
            </div>

            {/* Manual entry card */}
            <form onSubmit={handleAddManualGuest} className="bg-rose-50/30 border border-pink-100 p-4 rounded-xl space-y-4" id="manual-guest-form">
              <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <UserPlus className="w-4.5 h-4.5 text-pink-500" />
                កត់ត្រា និងបន្ថែមឈ្មោះភ្ញៀវដោយផ្ទាល់ (គណៈចាត់តាំង)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="ឈ្មោះភ្ញៀវ"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-800 rounded-lg p-2 text-xs outline-none"
                  id="manual-guest-name"
                />
                <input
                  type="text"
                  required
                  placeholder="លេខទូរស័ព្ទ"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-800 rounded-lg p-2 text-xs outline-none"
                  id="manual-guest-phone"
                />
                <select
                  value={manualCompanions}
                  onChange={(e) => setManualCompanions(parseInt(e.target.value) || 0)}
                  className="bg-white border border-slate-200 text-slate-800 rounded-lg p-2 text-xs outline-none"
                  id="manual-guest-companions"
                >
                  <option value={0}>អត់មានអ្នកមកជាមួយ</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <option key={n} value={n}>មកជាមួយ +{n} នាក់</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={manualRelation}
                  onChange={(e) => setManualRelation(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-800 rounded-lg p-2 text-xs outline-none"
                  id="manual-guest-relation"
                >
                  <option value="ខាងកូនកំលោះ">ខាងកូនកំលោះ</option>
                  <option value="ខាងកូនក្រមុំ">ខាងកូនក្រមុំ</option>
                  <option value="មិត្តភក្តិ">មិត្តភក្តិ</option>
                  <option value="ផ្សេងៗ">ផ្សេងៗ</option>
                </select>

                <input
                  type="number"
                  placeholder="ប្រាក់ចងដៃ (USD)"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-800 rounded-lg p-2 text-xs outline-none font-bold text-pink-600"
                  id="manual-guest-amount"
                />

                <input
                  type="text"
                  placeholder="កំណត់សម្គាល់/ពាក្យជូនពរ"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-800 rounded-lg p-2 text-xs outline-none"
                  id="manual-guest-note"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-pink-500 hover:bg-pink-600 rounded-lg transition shadow-sm"
                id="manual-guest-submit-btn"
              >
                ចុះឈ្មោះភ្ញៀវនេះភ្លាម
              </button>
            </form>
          </div>

          {/* Guest list and Switch area */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden" id="admin-guest-table-wrapper">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="font-serif font-bold text-xs text-slate-700">បញ្ជីឈ្មោះភ្ញៀវទាំងអស់ ({filteredGuests.length} នាក់)</span>
              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="រកតាមឈ្មោះ ឬលេខទូរស័ព្ទ..."
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none focus:ring-pink-400 focus:border-pink-400"
                  id="admin-search-input"
                />
              </div>
            </div>

            {filteredGuests.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-light">
                មិនមានទិន្នន័យភ្ញៀវត្រូវគ្នានឹងការស្វែងរកឡើយ ឬមិនទាន់មានភ្ញៀវចុះឈ្មោះក្នុងកម្មវិធីនេះការឡើយ។
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" id="admin-guests-table">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-500 font-bold text-2xs uppercase tracking-wider border-b border-slate-100">
                      <th className="p-4">ឈ្មោះភ្ញៀវ</th>
                      <th className="p-4">លេខទូរស័ព្ទ</th>
                      <th className="p-4 text-center">អ្នកមកជាមួយ</th>
                      <th className="p-4">ទំនាក់ទំនង</th>
                      <th className="p-4 text-right">ប្រាក់ចងដៃ</th>
                      <th className="p-4">ស្ថានភាព</th>
                      <th className="p-4 text-center">សកម្មភាព</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredGuests.map((g) => (
                      <tr key={g.id} className="hover:bg-pink-50/20 text-slate-700">
                        <td className="p-4">
                          <span className="font-bold block text-slate-900">{g.name}</span>
                          {g.note && (
                            <span className="text-3xs text-slate-400 italic font-light block line-clamp-1 mt-0.5">{g.note}</span>
                          )}
                        </td>
                        <td className="p-4 font-mono font-medium">{g.phone}</td>
                        <td className="p-4 text-center font-bold">+{g.companions} នាក់</td>
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
                        <td className="p-4 text-right font-bold text-emerald-600">${g.amount.toFixed(2)}</td>
                        <td className="p-4">
                          {g.status === 'approved' ? (
                            <span className="text-emerald-600 font-extrabold flex items-center gap-1 text-2xs">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              បានអនុម័ត
                            </span>
                          ) : (
                            <span className="text-amber-500 font-extrabold flex items-center gap-1 text-2xs">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                              កំពុងផ្ទៀងផ្ទាត់
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5" id={`actions-${g.id}`}>
                            {g.status === 'pending' && (
                              <button
                                onClick={() => handleApproveGuest(g.id)}
                                className="p-1.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg transition"
                                title="អនុម័ត"
                                id={`approve-btn-${g.id}`}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteGuest(g.id)}
                              className="p-1.5 bg-rose-500 text-white hover:bg-rose-600 rounded-lg transition"
                              title="លុប"
                              id={`delete-btn-${g.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
