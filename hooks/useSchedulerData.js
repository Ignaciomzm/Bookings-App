import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';

const ADMIN_EMAIL = 'josemunoz@outlook.com.au';

export function useSchedulerData(user, profile) {
  const debugLog = useCallback((...args) => {
    const isDev =
      (typeof __DEV__ !== 'undefined' && __DEV__) ||
      (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production');
    if (isDev) {
      console.log(...args);
    }
  }, []);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [syncing, setSyncing] = useState(false);

  const loadServices = useCallback(async () => {
    setSyncing(true);
    const { data, error } = await supabase.from('services').select('*').order('name', { ascending: true });

    debugLog('[Scheduler] Services load', { data, error, count: data?.length });

    if (error) {
      console.error('Services load error:', error);
      setSyncing(false);
      return;
    }

    setServices(data || []);
    debugLog('[Scheduler] Services state set', data);
    setSyncing(false);
  }, [debugLog]);

  const loadStaff = useCallback(async () => {
    setSyncing(true);
    const { data, error } = await supabase.from('staff').select('*').order('name', { ascending: true });
    debugLog('[Scheduler] Staff load', { data, error, count: data?.length });
    if (error) {
      console.error('Staff load error:', error);
      setSyncing(false);
      return;
    }
    const records = data || [];
    const lucyna = records.find((s) => (s.name || '').toLowerCase().includes('lucyna'));
    const rest = records.filter((s) => s !== lucyna);
    const finalStaff = lucyna ? [lucyna, ...rest] : records;
    debugLog('[Scheduler] Final staff array', finalStaff);
    setStaff(finalStaff);
    setSyncing(false);
  }, [debugLog]);

  const loadBookings = useCallback(async () => {
    setSyncing(true);

    const userEmail = (user?.email || '').toLowerCase();
    const userRole = profile?.role || 'staff';
    const isUserAdmin = userEmail === ADMIN_EMAIL || userRole === 'admin';

    debugLog('[Scheduler] Admin check', { userEmail, userRole, isUserAdmin });

    let query = supabase.from('bookings').select('*');

    debugLog('[Scheduler] Admin check', {
      userEmail,
      userRole,
      isUserAdmin,
    });

    const { data } = await query.order('start_at', { ascending: true });
    setBookings(data || []);
    setSyncing(false);
  }, [debugLog, profile?.role, user?.email]);

  const reloadAll = useCallback(async () => {
    setSyncing(true);
    await Promise.all([loadServices(), loadStaff(), loadBookings()]);
    setSyncing(false);
  }, [loadBookings, loadServices, loadStaff]);

  useEffect(() => {
    if (user?.id) {
      reloadAll();
    }
  }, [user?.id, reloadAll]);

  useEffect(() => {
    if (!user?.id) return undefined;

    const bookingsChannel = supabase
      .channel('bookings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          debugLog('Bookings change detected:', payload);
          loadBookings();
        }
      )
      .subscribe();

    const servicesChannel = supabase
      .channel('services_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'services' },
        (payload) => {
          debugLog('Services change detected:', payload);
          loadServices();
        }
      )
      .subscribe();

    const staffChannel = supabase
      .channel('staff_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff' },
        (payload) => {
          debugLog('Staff change detected:', payload);
          loadStaff();
        }
      )
      .subscribe();

    return () => {
      debugLog('Cleaning up real-time subscriptions');
      bookingsChannel.unsubscribe();
      servicesChannel.unsubscribe();
      staffChannel.unsubscribe();
    };
  }, [debugLog, loadBookings, loadServices, loadStaff, user?.id]);

  return {
    services,
    staff,
    bookings,
    syncing,
    setSyncing,
    loadServices,
    loadStaff,
    loadBookings,
    reloadAll,
  };
}
