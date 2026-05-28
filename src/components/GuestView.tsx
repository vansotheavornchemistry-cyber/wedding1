import { useState, useEffect } from 'react';
import { DatabaseService } from '../supabaseClient';
import { Wedding, Guest } from '../types';
import { Heart, Gift, Users, Phone, User, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';

interface GuestViewProps {
  initialWeddingId?: string;
  weddings: Wedding[];
}

export default function GuestView({ initialWeddingId, weddings }: GuestViewProps) {
  const [selectedWeddingId, setSelectedWeddingId] = useState<string>(initialWeddingId || '');
  const [selectedWedding, setSelectedWedding] = useState<Wedding | null>(null);

  // Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [companions, setCompanions] = useState<number>(0);
  const [relationType, setRelationType] = useState('ខាងកូនកំលោះ');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState('');

  // UI Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (weddings.length > 0) {
      const match = weddings.find(w => w.id === selectedWeddingId) || weddings[0];
      setSelectedWedding(match);
      if (!selectedWeddingId) {
        setSelectedWeddingId(match.id);
      }
    }
  }, [selectedWeddingId, weddings]);

  const handleWeddingChange = (weddingId: string) => {
    setSelectedWeddingId(weddingId);
    setErrorMsg('');
    setShowSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWeddingId) {
      setErrorMsg('សូមជ្រើសរើសកម្មវិធីមង្គលការ!');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('សូមបញ្ចូលឈ្មោះរបស់អ្នកលេង!');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('សូមបញ្ចូលលេខទូរស័ព្ទរបស់អ្នក!');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const parsedAmount = parseFloat(amount) || 0;
      const guestData: Omit<Guest, 'id'> = {
        wedding_id: selectedWeddingId,
        name: name.trim(),
        phone: phone.trim(),
        companions: companions,
        relation_type: relationType,
        amount: parsedAmount,
        note: note.trim(),
        status: 'pending' as const
      };

      const result = await DatabaseService.addGuest(guestData);
      if (result) {
        setShowSuccess(true);
        // Clear form
        setName('');
        setPhone('');
        setCompanions(0);
        setRelationType('ខាងកូនកំលោះ');
        setAmount('');
        setNote('');
      } else {
        setErrorMsg('មានបញ្ហាក្នុងការចុះឈ្មោះ សូមព្យាយាមម្តងទៀត។');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('កំហុសប្រព័ន្ធ៖ ' + (err.message || 'សូមព្យាយាមម្តងទៀត។'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (weddings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-xl border border-pink-100 max-w-lg mx-auto text-center" id="no-events-card">
        <Heart className="w-16 h-16 text-pink-300 animate-pulse mb-4" />
        <h2 className="text-2xl font-serif text-pink-800 font-bold mb-2">មិនទាន់មានកម្មវិធីមង្គលការនៅឡើយទេ</h2>
        <p className="text-slate-500 text-sm">សូមចូលទៅកាន់គណនី Admin ដើម្បីបង្កើតកម្មវិធីមង្គលការមុនគេបង្អស់។</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6" id="guest-view-container">
      {/* Selector of Wedding */}
      <div className="mb-6 bg-white p-4 rounded-2xl shadow-sm border border-pink-50/50 flex flex-col md:flex-row items-center justify-between gap-4" id="wedding-selector-panel">
        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
          សូមជ្រើសរើសកម្មវិធីមង្គលការ៖
        </label>
        <select
          value={selectedWeddingId}
          onChange={(e) => handleWeddingChange(e.target.value)}
          className="w-full md:w-72 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-pink-500 focus:border-pink-500 p-2.5 outline-none font-medium text-center"
          id="guest-wedding-select"
        >
          {weddings.map((w) => (
            <option key={w.id} value={w.id} className="text-slate-800">
              {w.title}
            </option>
          ))}
        </select>
      </div>

      {selectedWedding && (
        <div className="space-y-6" id={`wedding-rsvp-${selectedWedding.id}`}>
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-pink-500 to-rose-400 p-8 rounded-3xl text-white text-center shadow-lg relative overflow-hidden" id="event-header-banner">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl transform -translate-x-10 translate-y-10"></div>
            <Heart className="w-12 h-12 text-white/90 fill-white/20 mx-auto mb-3 animate-bounce" />
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-center tracking-wide leading-relaxed">
              {selectedWedding.title}
            </h1>
            <p className="text-pink-100 text-sm mt-2 font-light">
              សូមស្វាគមន៍ជម្រើសដ៏វិសេសវិសាល! សូមចុះឈ្មោះចូលរួមបង្កើនភាពអធិកអធម និងអបអរសាទរ
            </p>
          </div>

          {showSuccess && (
            <div className="bg-white border-2 border-emerald-500 p-6 rounded-2xl text-center shadow-lg" id="rsvp-success-modal">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-3 animate-ping-once" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">ការចុះឈ្មោះទទួលបានជោគជ័យ!</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                ព័ត៌មានរបស់អ្នកត្រូវបានកត់ត្រាទុកក្នុងប្រព័ន្ធរួចរាល់ហើយ។
                <br />
                <span className="font-semibold text-pink-600">សូមរង់ចាំការអនុម័ត និងទទួលស្វាគមន៍ពីក្រុមការងារសម្របសម្រួល។</span>
              </p>
              <button
                type="button"
                onClick={() => setShowSuccess(false)}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition"
                id="close-success-btn"
              >
                ចុះឈ្មោះភ្ញៀវផ្សេងទៀត
              </button>
            </div>
          )}

          {!showSuccess && (
            <form onSubmit={handleSubmit} className="bg-white border border-pink-100 rounded-3xl shadow-xl p-8 space-y-6" id="rsvp-form">
              <h2 className="text-xl font-bold font-serif text-slate-800 border-b border-rose-50 pb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-500" />
                ទម្រង់ចុះឈ្មោះ និងពិនិត្យចំណងដៃ
              </h2>

              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-2 text-rose-700 text-sm" id="form-error-alert">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name field */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-slate-400" />
                    ឈ្មោះរបស់លោកអ្នក <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ឧ. លឹម ហួរ"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-pink-400 focus:border-pink-400 p-3 outline-none text-sm font-medium"
                    id="input-guest-name"
                  />
                </div>

                {/* Phone field */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-slate-400" />
                    លេខទូរស័ព្ទ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="ឧ. 012 345 678"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-pink-400 focus:border-pink-400 p-3 outline-none text-sm font-medium"
                    id="input-guest-phone"
                  />
                </div>

                {/* Companions */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-400" />
                    ចំនួនអ្នកមកជាមួយ
                  </label>
                  <select
                    value={companions}
                    onChange={(e) => setCompanions(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-pink-400 focus:border-pink-400 p-3 outline-none text-sm font-medium"
                    id="input-guest-companions"
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num}>+{num} នាក់</option>
                    ))}
                  </select>
                </div>

                {/* Relation Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-slate-400" />
                    ប្រភេទទំនាក់ទំនង
                  </label>
                  <div className="grid grid-cols-2 gap-2" id="relation-type-group">
                    {['ខាងកូនកំលោះ', 'ខាងកូនក្រមុំ', 'មិត្តភក្តិ', 'ផ្សេងៗ'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setRelationType(type)}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border transition ${
                          relationType === type
                            ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white border-pink-500 shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                        id={`relation-btn-${type}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gift Amount in USD */}
                <div className="md:col-span-2 bg-pink-50/40 p-4 rounded-2xl border border-pink-100/50">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="w-full">
                      <label className="block text-sm font-bold text-pink-900 mb-1.5 flex items-center gap-1.5">
                        <Gift className="w-4.5 h-4.5 text-pink-500" />
                        ចំនួនប្រាក់ចងដៃ (ប្រាក់ដុល្លារ USD)
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold">$</span>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="ឧ. 50"
                          min="0"
                          className="w-full bg-white border border-pink-200 text-slate-800 rounded-xl focus:ring-pink-400 focus:border-pink-400 pl-8 p-3 outline-none text-base font-bold"
                          id="input-guest-amount"
                        />
                      </div>
                      <p className="text-xs text-rose-500 mt-1 font-light leading-snug">
                        *ចំពោះការផ្ទេរតាម KHQR រួចរាល់ សូមវាយបញ្ចូលចំនួនទឹកប្រាក់ដែលបានផ្ទេរ។
                      </p>
                    </div>

                    {/* QR Code Section */}
                    {selectedWedding.khqr_img_url && (
                      <div className="flex flex-col items-center bg-white p-3 rounded-2xl border border-pink-100 shadow-sm w-full md:w-auto" id="khqr-display-panel">
                        <span className="text-2xs font-extrabold text-pink-600 tracking-wide uppercase mb-1">ស្កែនដើម្បីផ្ទេរប្រាក់ចងដៃ</span>
                        <img
                          src={selectedWedding.khqr_img_url}
                          alt="Bakong KHQR"
                          referrerPolicy="no-referrer"
                          className="w-32 h-32 object-contain rounded-lg border bg-slate-50"
                          id="khqr-image-preview"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://api-qr.bakong.org.kh/images/khqr_mock.png';
                          }}
                        />
                        <span className="text-3xs text-slate-400 mt-1">KHQR / Bakong / ABA</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-slate-400" />
                    សារជូនពរ ឬកំណត់សម្គាល់ (សរសេរភាសាខ្មែរ)
                  </label>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="ឧ. សូមជូនពរជ័យមង្គល និងសុភមង្គលក្នុងគ្រួសារថ្មី!"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-pink-400 focus:border-pink-400 p-3 outline-none text-sm font-medium"
                    id="input-guest-note"
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 text-base font-bold text-white bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                id="submit-rsvp-btn"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    កំពុងរក្សាទុក...
                  </>
                ) : (
                  <>
                    <Heart className="w-5 h-5 fill-white" />
                    ចុះឈ្មោះឥឡូវនេះ (RSVP)
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
