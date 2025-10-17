// mobile/services/sync.js
import * as SQLite from 'expo-sqlite';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';

// ---------- Provider mapping (fill these in .env when ready) ----------
const STATIC_PROVIDER_MAP = {
  lucyna: process.env.EXPO_PUBLIC_PROVIDER_LUCYNA_UID || null,
  ewa:    process.env.EXPO_PUBLIC_PROVIDER_EWA_UID    || null,
};

// returns a UUID (string) if resolved, or null if unknown/missing
function resolveProviderId(rawId) {
  if (!rawId) return null;
  if (STATIC_PROVIDER_MAP.hasOwnProperty(rawId)) {
    return STATIC_PROVIDER_MAP[rawId] || null;
  }
  // For normal users (actual auth.users UUIDs), pass through
  return rawId;
}
// ---------------------------------------------------------------------

const QUEUE_KEY = '@pending_bookings_v1';
const hasSQLite = !!(SQLite && (SQLite.openDatabase || SQLite.openDatabaseSync));
let db = null;
if (hasSQLite && SQLite.openDatabase) {
  db = SQLite.openDatabase('scheduler.db');
}

function initSqlite() {
  db.transaction(tx => {
    tx.executeSql(`CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY NOT NULL,
      client_name TEXT,
      client_phone TEXT,
      service TEXT,
      provider_id TEXT,
      provider_name TEXT,
      starts_at TEXT,
      ends_at TEXT,
      timezone TEXT,
      notes TEXT,
      status TEXT DEFAULT 'confirmed',
      sync_status TEXT DEFAULT 'synced'
    );`);
  });
}

function listSqlite(setter) {
  db.readTransaction(tx => {
    tx.executeSql(`SELECT * FROM bookings ORDER BY datetime(starts_at) DESC;`, [], (_, { rows }) => {
      setter(rows._array || []);
    });
  });
}

function upsertSqlite(bk) {
  db.transaction(tx => {
    tx.executeSql(
      `INSERT OR REPLACE INTO bookings
       (id, client_name, client_phone, service, provider_id, provider_name, starts_at, ends_at, timezone, notes, status, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        bk.id, bk.client_name, bk.client_phone, bk.service, bk.provider_id, bk.provider_name,
        bk.starts_at, bk.ends_at, bk.timezone, bk.notes || '', bk.status || 'confirmed', bk.sync_status || 'pending'
      ]
    );
  });
}

function markSqlite(id, status = 'synced') {
  db.transaction(tx => {
    tx.executeSql(`UPDATE bookings SET sync_status=? WHERE id=?;`, [status, id]);
  });
}

// AsyncStorage fallback store
async function readQueue() {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}
async function writeQueue(items) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export function initLocalDb() {
  if (hasSQLite && db) {
    initSqlite();
  } else {
    console.log('SQLite not available; using AsyncStorage fallback.');
  }
}

export function listLocalBookings(setter) {
  if (hasSQLite && db) {
    listSqlite(setter);
  } else {
    readQueue().then(items => {
      setter(items.sort((a,b) => (b.starts_at || '').localeCompare(a.starts_at || '')));
    });
  }
}

export function upsertLocalBooking(bk) {
  if (hasSQLite && db) {
    upsertSqlite(bk);
  } else {
    readQueue().then(items => {
      const idx = items.findIndex(x => x.id === bk.id);
      if (idx >= 0) items[idx] = bk; else items.push(bk);
      return writeQueue(items);
    });
  }
}

// helper (fallback) to update a single item in AsyncStorage by id
async function markAsyncItem(id, status) {
  const items = await readQueue();
  const idx = items.findIndex(x => x.id === id);
  if (idx >= 0) items[idx].sync_status = status;
  await writeQueue(items);
}

export async function syncPending(setter) {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return;

  if (hasSQLite && db) {
    db.readTransaction(tx => {
      tx.executeSql(`SELECT * FROM bookings WHERE sync_status='pending';`, [], async (_, { rows }) => {
        const items = rows._array || [];
        await syncItems(items, (id, status) => markSqlite(id, status));
        listLocalBookings(setter);
      });
    });
  } else {
    const all = await readQueue();
    const pend = all.filter(it => it.sync_status === 'pending');
    await syncItems(pend, (id, status) => markAsyncItem(id, status));
    listLocalBookings(setter);
  }
}

async function syncItems(items, markFn) {
  for (const it of items) {
    try {
      // Resolve provider_id (supports static aliases)
      const resolvedProvider = resolveProviderId(it.provider_id);

      // If unresolved (e.g., you haven't provided UUIDs yet), keep it pending and continue
      if (!resolvedProvider) {
        console.log(
          `[SYNC] Booking ${it.id} is waiting for provider mapping. ` +
          `Set EXPO_PUBLIC_PROVIDER_LUCYNA_UID / EWA_UID in .env if applicable.`
        );
        continue; // leave as 'pending'
      }

      const payload = {
        id: it.id,
        client_name: it.client_name,
        client_phone: it.client_phone,
        service: it.service,
        provider_id: resolvedProvider,       // <-- mapped UUID
        provider_name: it.provider_name,     // keep display name
        starts_at: it.starts_at,
        ends_at: it.ends_at,
        timezone: it.timezone,
        notes: it.notes,
        status: it.status,
      };

      const { error } = await supabase
        .from('bookings')
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;

      // Send confirmation (SMS/WhatsApp) after DB upsert succeeds
      await fetch(`${SUPABASE_URL}/functions/v1/sms-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          to: it.client_phone,
          message: `Hi ${it.client_name}, your ${it.service} is booked on ${dayjs(it.starts_at).format('YYYY-MM-DD HH:mm')} with ${it.provider_name}.`
          // channel: 'whatsapp' // uncomment per-message if desired
        })
      });

      await markFn(it.id, 'synced');
    } catch (e) {
      console.log('[SYNC ERROR]', e?.message || e);
      await markFn(it.id, 'failed');
    }
  }
}
