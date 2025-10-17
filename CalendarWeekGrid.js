// mobile/CalendarWeekGrid.js
import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';

/**
 * Props:
 * - weekStart: Date (Monday 00:00)
 * - staff: [{ id, name, color }]
 * - bookings: [{ id, start_at, duration_min, staff_id, service_name?, client_name? }]
 * - initialScrollHour?: number            (default = timeStartHour)
 * - timeStartHour?: number                (default = 8)    // first hour shown
 * - timeEndHour?: number                  (default = 24)   // last hour boundary (exclusive)
 * - onPressBooking?: (booking) => void
 */
export default function CalendarWeekGrid({
  weekStart,
  staff = [],
  bookings = [],
  initialScrollHour,
  timeStartHour = 8,
  timeEndHour = 24,
  onPressBooking,
}) {
  // Taller grid so scrolling covers 08:00 → 24:00 comfortably
  const PX_PER_MIN = 1.5;     // 60 min => 90 px
  const TOP_PAD = 24;          // make 08:00 scrollable into view (not glued under header)
  const BOTTOM_PAD = 24;       // breathing room at the end

  // Visible window
  const START_H = clamp(Math.floor(+timeStartHour || 8), 0, 23);
  const END_H = clamp(Math.ceil(+timeEndHour || 24), START_H + 1, 24);
  const VISIBLE_START_MIN = START_H * 60;
  const VISIBLE_END_MIN = END_H * 60;
  const VISIBLE_MINUTES = VISIBLE_END_MIN - VISIBLE_START_MIN;
  const DAY_HEIGHT = VISIBLE_MINUTES * PX_PER_MIN; // height for the visible hours

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

  // group bookings by weekday (0..6), clamp to visible window
  const byDay = useMemo(() => {
    const m = Array.from({ length: 7 }, () => []);
    for (const b of bookings || []) {
      if (!b.start_at) continue;
      const start = new Date(b.start_at);
      const dayIdx = indexOfDay(start, days[0]);
      if (dayIdx < 0 || dayIdx > 6) continue;

      const minutes = start.getHours() * 60 + start.getMinutes();
      const durMin = Math.max(0, Number(b.duration_min || 60));
      const endMin = minutes + durMin;

      // clamp to visible window [VISIBLE_START_MIN, VISIBLE_END_MIN]
      const visTopMin = Math.max(minutes, VISIBLE_START_MIN);
      const visEndMin = Math.min(endMin, VISIBLE_END_MIN);
      const visDurMin = Math.max(0, visEndMin - visTopMin);
      if (visDurMin <= 0) continue; // entirely outside window

      const top = TOP_PAD + (visTopMin - VISIBLE_START_MIN) * PX_PER_MIN;
      const height = Math.max(28, visDurMin * PX_PER_MIN);

      m[dayIdx].push({
        ...b,
        start,
        top,
        height,
        color: staffColor[b.staff_id] || '#94A3B8',
      });
    }
    for (let i = 0; i < 7; i++) m[i].sort((a, b) => a.start - b.start);
    return m;
  }, [bookings, days, staffColor, PX_PER_MIN, VISIBLE_START_MIN, VISIBLE_END_MIN]);

  // hourly marks (visible range only)
  const timeMarks = useMemo(() => {
    const marks = [];
    for (let h = START_H; h <= END_H; h++) {
      const minFromStart = h * 60 - VISIBLE_START_MIN;
      marks.push({
        hour: h,
        top: TOP_PAD + minFromStart * PX_PER_MIN,
        label: pad2(h) + ':00',
      });
    }
    return marks;
  }, [START_H, END_H, VISIBLE_START_MIN, PX_PER_MIN]);

  // auto-scroll (start exactly at START_H; there's top padding now)
  const vref = useRef(null);
  useEffect(() => {
    const initH = (initialScrollHour == null ? START_H : initialScrollHour);
    const clampedH = clamp(initH, START_H, END_H);
    const y = (clampedH - START_H) * 60 * PX_PER_MIN;
    setTimeout(() => vref.current?.scrollTo({ y: clamp(y, 0, TOP_PAD + DAY_HEIGHT + BOTTOM_PAD), animated: false }), 0);
  }, [initialScrollHour, START_H, END_H, DAY_HEIGHT, PX_PER_MIN]);

  // determine today (no new props, no name changes)
  const today = new Date();

  return (
    <View style={s.wrap}>
      {/* Header: weekday + date */}
      <View style={s.headerRow}>
        <View style={s.timeHeaderCell} />
        {days.map((d, idx) => {
          const isToday = isSameDay(d, today);
          return (
            <View key={idx} style={[s.dayHeaderCell, isToday && s.todayHeaderCell]}>
              <Text style={[s.dayHeaderDow, isToday && s.todayHeaderDow]}>
                {d.toLocaleDateString(undefined, { weekday: 'short' })}
              </Text>
              <Text style={[s.dayHeaderDate, isToday && s.todayHeaderDate]}>{d.getDate()}</Text>
            </View>
          );
        })}
      </View>

      {/* Body: left gutter with times + 7 day columns */}
      <ScrollView
        ref={vref}
        showsVerticalScrollIndicator
        style={s.bodyScroll}
        contentContainerStyle={{}}
      >
        <View style={[s.bodyRow, { height: TOP_PAD + DAY_HEIGHT + BOTTOM_PAD }]}>
          {/* Time gutter */}
          <View style={s.timeCol}>
            {timeMarks.map((m, i) => (
              <View key={i} style={[s.timeMarkRow, { top: m.top }]}>
                <Text style={s.timeText}>{m.label}</Text>
                <View style={s.timeGridLine} />
              </View>
            ))}
          </View>

          {/* Day columns */}
          {days.map((d, dayIdx) => {
            const isToday = isSameDay(d, today);
            return (
              <View key={dayIdx} style={s.dayCol}>
                {isToday && <View pointerEvents="none" style={s.todayColUnderlay} />}
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
            );
          })}
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
function isSameDay(a, b) {
  if (!a || !b) return false;
  const aa = new Date(a); aa.setHours(0,0,0,0);
  const bb = new Date(b); bb.setHours(0,0,0,0);
  return aa.getTime() === bb.getTime();
}

/* ---------------- styles ---------------- */
const s = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },

  /* Header (days row) */
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  timeHeaderCell: { width: 72, padding: 10 },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#EEF2F7',
  },
  dayHeaderDow: { fontWeight: '800', color: '#111827', fontSize: 12 },
    dayHeaderDate: { marginTop: 2, color: '#A08A4A', fontWeight: '700', fontSize: 13 },

  /* "Today" highlight in header */
    todayHeaderCell: { backgroundColor: '#A08A4A' },
    todayHeaderDow: { color: '#fff', fontWeight: '900' },
    todayHeaderDate: { color: '#fff', fontWeight: '900' },

  /* Body */
  bodyScroll: {},
  bodyRow: { flexDirection: 'row', position: 'relative' },

  /* Time gutter (left) */
  timeCol: {
    width: 72,
    position: 'relative',
    backgroundColor: '#F9FAFB',
  },
  timeMarkRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    alignItems: 'flex-start',
  },
  // Label above the line with bg so grid never bleeds through
  timeText: {
    position: 'absolute',
    top: -10,
    left: 8,
    fontSize: 11,
    color: '#6B7280',
    zIndex: 2,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 2,
  },
  timeGridLine: {
    position: 'absolute',
    right: 0,
    left: 0,
    height: 1,
    backgroundColor: '#ECEFF4',
    zIndex: 1,
  },

  /* Day columns (grid lines) */
  dayCol: {
    flex: 1,
    position: 'relative',
    borderLeftWidth: 1,
    borderLeftColor: '#EEF2F7',
    backgroundColor: '#fff',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F3F4F6',
  },

  /* "Today" underlay for the column */
  todayColUnderlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF9E6',
    zIndex: 0,
  },

  /* Booking blocks */
  block: {
    position: 'absolute',
    left: 6,
    right: 6,
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 6,
    gap: 2,
  },
  blockDot: { width: 8, height: 8, borderRadius: 8, position: 'absolute', top: 6, left: 6 },
  blockTitle: { fontWeight: '800', color: '#1d342e', paddingLeft: 14, fontSize: 12 },
  blockSub:   { color: '#374151',  paddingLeft: 14, fontSize: 11 },
});
