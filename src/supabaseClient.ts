import { createClient } from '@supabase/supabase-js';
import { Guest, Wedding, Admin } from './types';

// Safe environment fallback keys
// Using global window.env or import.meta.env for local development
const SUPABASE_URL = (window as any).env?.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (window as any).env?.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = SUPABASE_URL.trim() !== '' && SUPABASE_ANON_KEY.trim() !== '';

// Initialize Supabase if keys are provided
export const supabaseClient = isSupabaseConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

/**
 * DATABASE SERVICE
 * Dual implementation: Real Supabase or local storage simulation.
 * This guarantees the application is fully functional and interactive right out of the box in the preview environment, 
 * but connects dynamically to Supabase once credentials are provided!
 */

// Helper to seed localStorage
const seedLocalStorage = () => {
  if (!localStorage.getItem('wedding_admins')) {
    const defaultAdmins: Admin[] = [
      { id: 'admin-uuid-123', username: 'admin123', password: 'password123' }
    ];
    localStorage.setItem('wedding_admins', JSON.stringify(defaultAdmins));
  }

  if (!localStorage.getItem('wedding_events')) {
    const defaultWeddings: Wedding[] = [
      {
        id: '88888888-8888-4888-baaa-888888888888',
        title: 'ពិធីមង្គលការ សុភ័ក្ត្រ និង សុជាតា',
        host_username: 'socheata123',
        host_password: 'password123',
        khqr_img_url: 'https://api-qr.bakong.org.kh/images/khqr_mock.png',
        created_at: new Date().toISOString()
      },
      {
        id: '99999999-9999-4999-bbbb-999999999999',
        title: 'ពិធីមង្គលការ ណារិទ្ធ និង ទេវី',
        host_username: 'tevy123',
        host_password: 'password123',
        khqr_img_url: 'https://api-qr.bakong.org.kh/images/khqr_mock.png',
        created_at: new Date().toISOString()
      }
    ];
    localStorage.setItem('wedding_events', JSON.stringify(defaultWeddings));
  }

  if (!localStorage.getItem('wedding_guests')) {
    const defaultGuests: Guest[] = [
      {
        id: 'g-1',
        wedding_id: '88888888-8888-4888-baaa-888888888888',
        name: 'លោក ចាន់ ណារិទ្ធ',
        phone: '012345678',
        companions: 2,
        relation_type: 'ខាងកូនកំលោះ',
        amount: 50,
        note: 'សូមជូនពរឱ្យអ្នកទាំងពីរកាន់ដៃគ្នាជារៀងរហូត!',
        status: 'approved',
        created_at: new Date().toISOString()
      },
      {
        id: 'g-2',
        wedding_id: '88888888-8888-4888-baaa-888888888888',
        name: 'អ្នកស្រី សុខ ម៉ារី',
        phone: '098765432',
        companions: 1,
        relation_type: 'ខាងកូនក្រមុំ',
        amount: 100,
        note: 'ជោគជ័យ និងសុភមង្គល!',
        status: 'approved',
        created_at: new Date().toISOString()
      },
      {
        id: 'g-3',
        wedding_id: '88888888-8888-4888-baaa-888888888888',
        name: 'លោក លី សុជាតិ',
        phone: '088123456',
        companions: 0,
        relation_type: 'មិត្តភក្តិ',
        amount: 30,
        note: 'សុំទោសដែលមិនបានទៅផ្ទាល់ តែសូមជូនពរពីចម្ងាយ!',
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ];
    localStorage.setItem('wedding_guests', JSON.stringify(defaultGuests));
  }
};

seedLocalStorage();

export const DatabaseService = {
  // 1. ADMINS
  async loginAdmin(username: string, password: string): Promise<Admin | null> {
    if (isSupabaseConfigured && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('admins')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .maybeSingle();
      if (error) console.error('Supabase admin login error:', error);
      return data;
    } else {
      const admins = JSON.parse(localStorage.getItem('wedding_admins') || '[]');
      const found = admins.find((a: Admin) => a.username === username && a.password === password);
      return found || null;
    }
  },

  // 2. WEDDINGS
  async loginHost(username: string, password: string): Promise<Wedding | null> {
    if (isSupabaseConfigured && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('weddings')
        .select('*')
        .eq('host_username', username)
        .eq('host_password', password)
        .maybeSingle();
      if (error) console.error('Supabase host login error:', error);
      return data;
    } else {
      const weddings = JSON.parse(localStorage.getItem('wedding_events') || '[]');
      const found = weddings.find((w: Wedding) => w.host_username === username && w.host_password === password);
      return found || null;
    }
  },

  async getWeddings(): Promise<Wedding[]> {
    if (isSupabaseConfigured && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('weddings')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Supabase fetch weddings error:', error);
        return [];
      }
      return data || [];
    } else {
      return JSON.parse(localStorage.getItem('wedding_events') || '[]');
    }
  },

  async createWedding(wedding: Omit<Wedding, 'id'>): Promise<Wedding | null> {
    if (isSupabaseConfigured && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('weddings')
        .insert([wedding])
        .select()
        .single();
      if (error) {
        console.error('Supabase insert wedding error:', error);
        return null;
      }
      return data;
    } else {
      const weddings = JSON.parse(localStorage.getItem('wedding_events') || '[]');
      const newWedding: Wedding = {
        ...wedding,
        id: `w-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        created_at: new Date().toISOString()
      };
      weddings.unshift(newWedding);
      localStorage.setItem('wedding_events', JSON.stringify(weddings));
      return newWedding;
    }
  },

  // 3. GUESTS
  async getGuests(weddingId: string): Promise<Guest[]> {
    if (isSupabaseConfigured && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('guests')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Supabase fetch guests error:', error);
        return [];
      }
      return data || [];
    } else {
      const guests = JSON.parse(localStorage.getItem('wedding_guests') || '[]');
      return guests.filter((g: Guest) => g.wedding_id === weddingId);
    }
  },

  async addGuest(guest: Omit<Guest, 'id'>): Promise<Guest | null> {
    if (isSupabaseConfigured && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('guests')
        .insert([guest])
        .select()
        .single();
      if (error) {
        console.error('Supabase insert guest error:', error);
        return null;
      }
      return data;
    } else {
      const guests = JSON.parse(localStorage.getItem('wedding_guests') || '[]');
      const newGuest: Guest = {
        ...guest,
        id: `g-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        created_at: new Date().toISOString()
      };
      guests.unshift(newGuest);
      localStorage.setItem('wedding_guests', JSON.stringify(guests));
      return newGuest;
    }
  },

  async updateGuestStatus(guestId: string, status: 'pending' | 'approved'): Promise<boolean> {
    if (isSupabaseConfigured && supabaseClient) {
      const { error } = await supabaseClient
        .from('guests')
        .update({ status })
        .eq('id', guestId);
      if (error) {
        console.error('Supabase update guest status error:', error);
        return false;
      }
      return true;
    } else {
      const guests = JSON.parse(localStorage.getItem('wedding_guests') || '[]');
      const index = guests.findIndex((g: Guest) => g.id === guestId);
      if (index !== -1) {
        guests[index].status = status;
        localStorage.setItem('wedding_guests', JSON.stringify(guests));
        return true;
      }
      return false;
    }
  },

  async deleteGuest(guestId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabaseClient) {
      const { error } = await supabaseClient
        .from('guests')
        .delete()
        .eq('id', guestId);
      if (error) {
        console.error('Supabase delete guest error:', error);
        return false;
      }
      return true;
    } else {
      const guests = JSON.parse(localStorage.getItem('wedding_guests') || '[]');
      const filtered = guests.filter((g: Guest) => g.id !== guestId);
      localStorage.setItem('wedding_guests', JSON.stringify(filtered));
      return true;
    }
  }
};
