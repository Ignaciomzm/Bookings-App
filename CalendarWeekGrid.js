// mobile/CalendarWeekGrid.js
import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';

/**
 * Props:
 * - weekStart: Date (Monday 00:00)
 * - staff: [{ id, name, color }]
 * - bookings: [{ id, start_at, duration_min, staff_id, service_name?, client_name? }]
 * - initialScrollHour?: number
 * - onPressBooking?: (booking) => void
 */
export default function CalendarWeekGrid({
  weekStart,
  staff = [],
  bookings = [],
  initialScrollHour = 8,
  onPressBooking,
}) {
  const PX_PER_MIN = 0.8; // 60 min -> 48 px; full day ≈ 1152 px
  const DAY_HEIGHT = 24 * 60 * PX_PER_MIN;

  // 7 days starting Monday
  const days = useMemo(() => {
    const arr = [];
    const base = new Date(weekStart);
    base.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [weekStart]);

  // staff color map
  const staffColor = useMemo(() => {
    const map = {};
    for (const s of staff) map[s.id] = s.color || '#5C6BC0';
    return map;
  }, [staff]);

  // group bookings by weekday (0..6)
  const byDay = useMemo(() => {
    const m = Array.from({ length: 7 }, () => []);
    for (const b of bookings || []) {
      if (!b.start_at) continue;
      const start = new Date(b.start_at);
      const dayIdx = indexOfDay(start, days[0]);
      if (dayIdx < 0 || dayIdx > 6) continue;

      const minutes = start.getHours() * 60 + start.getMinutes();
      const top = minutes * PX_PER_MIN;
      const height = Math.max(28, (Number(b.duration_min || 60)) * PX_PER_MIN);

      m[dayIdx].push({
        ...b,
        start,
        top,
        height,
        color: staffColor[b.staff_id] || '#94A3B8',
      });
    }
    // sort per day
    for (let i = 0; i < 7; i++) m[i].sort((a, b) => a.start - b.start);
    return m;
  }, [bookings, days, PX_PER_MIN, staffColor]);

  // hourly marks (00:00..24:00)
  const timeMarks = useMemo(() => {
    const marks = [];
    for (let h = 0; h <= 24; h++) {
      marks.push({ hour: h, top: h * 60 * PX_PER_MIN, label: pad2(h) + ':00' });
    }
    return marks;
  }, [PX_PER_MIN]);

  // auto-scroll to a comfortable hour
  const vref = useRef(null);
  useEffect(() => {
    const y = clamp(initialScrollHour * 60 * PX_PER_MIN - 64, 0, DAY_HEIGHT);
    setTimeout(() => vref.current?.scrollTo({ y, animated: false }), 0);
  }, [initialScrollHour, DAY_HEIGHT, PX_PER_MIN]);

  return (
    <View style={s.wrap}>
      {/* Header: weekday + date, perfectly centered above columns */}
      <View style={s.headerRow}>
        <View style={s.timeHeaderCell} />
        {days.map((d, idx) => (
          <View key={idx} style={s.dayHeaderCell}>
            <Text style={s.dayHeaderDow}>{d.toLocaleDateString(undefined, { weekday: 'short' })}</Text>
            <Text style={s.dayHeaderDate}>{d.getDate()}</Text>
          </View>
        ))}
      </View>

      {/* Body: left gutter with times + 7 day columns, fully scrollable */}
      <ScrollView ref={vref} style={s.bodyScroll} contentContainerStyle={{}}>
        <View style={[s.bodyRow, { height: DAY_HEIGHT }]}>
          {/* Time gutter (labels + faint line) */}
          <View style={s.timeCol}>
            {timeMarks.map((m, i) => (
              <View key={i} style={[s.timeMarkRow, { top: m.top }]}>
                <Text style={s.timeText}>{m.label}</Text>
                <View style={s.timeGridLine} />
              </View>
            ))}
          </View>

          {/* Day columns */}
          {days.map((_, dayIdx) => (
            <View key={dayIdx} style={s.dayCol}>
              {/* Hour grid lines inside each column for perfect alignment */}
              {timeMarks.map((m, i) => (
                <View key={i} style={[s.gridLine, { top: m.top }]} />
              ))}

              {/* Bookings */}
              {byDay[dayIdx].map((bk) => (
                <Pressable
                  key={bk.id}
                  onPress={() => onPressBooking?.(bk)}
                  style={[
                    s.block,
                    {
                      top: bk.top,
                      height: bk.height,
                      borderColor: bk.color,
                      backgroundColor: hexToRgba(bk.color, 0.16),
                    },
                  ]}
                >
                  <View style={[s.blockDot, { backgroundColor: bk.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.blockTitle} numberOfLines={1}>
                      {bk.service_name || 'Booking'}
                    </Text>
                    <Text style={s.blockSub} numberOfLines={1}>
                      {bk.client_name ? `${bk.client_name} · ` : ''}
                      {bk.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------------- helpers ---------------- */
function pad2(n) { return String(n).padStart(2, '0'); }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function indexOfDay(date, monday0) {
  const a = new Date(monday0); a.setHours(0,0,0,0);
  const b = new Date(date);   b.setHours(0,0,0,0);
  return Math.floor((b - a) / 86400000);
}
function hexToRgba(hex, alpha = 0.2) {
  if (!hex) return `rgba(92,107,192,${alpha})`;
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const int = parseInt(h, 16);
  const r = (int >> 16) & 255, g = (int >> 8) & 255, b = int & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ---------------- styles ---------------- */
const s = StyleSheet.create({
  wrap: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#F9FAFB',
  },
  timeHeaderCell: { width: 72, padding: 10 },
  dayHeaderCell: {
    flex: 1, alignItems: 'center', paddingVertical: 8, borderLeftWidth: 1, borderLeftColor: '#EEF2F7',
  },
  dayHeaderDow: { fontWeight: '800', color: '#111827', fontSize: 12 },
  dayHeaderDate: { marginTop: 2, color: '#6B7280', fontWeight: '700', fontSize: 13 },

  bodyScroll: { maxHeight: 1200 },
  bodyRow: { flexDirection: 'row', position: 'relative' },

  timeCol: {
    width: 72, position: 'relative', backgroundColor: '#F9FAFB',
  },
  timeMarkRow: {
    position: 'absolute', left: 0, right: 0, height: 1, alignItems: 'flex-start',
  },
  timeText: {
    position: 'absolute', top: -8, left: 8, fontSize: 11, color: '#6B7280',
  },
  timeGridLine: {
    position: 'absolute', right: 0, left: 0, height: 1, backgroundColor: '#ECEFF4',
  },

  dayCol: {
    flex: 1, position: 'relative', borderLeftWidth: 1, borderLeftColor: '#EEF2F7', backgroundColor: '#fff',
  },
  gridLine: {
    position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#F3F4F6',
  },

  block: {
    position: 'absolute', left: 6, right: 6,
    borderWidth: 1.5, borderRadius: 10, padding: 6, gap: 2,
  },
  blockDot: { width: 8, height: 8, borderRadius: 8, position: 'absolute', top: 6, left: 6 },
  blockTitle: { fontWeight: '800', color: '#111827', paddingLeft: 14, fontSize: 12 },
  blockSub:   { color: '#374151',  paddingLeft: 14, fontSize: 11 },
});
