// mobile/CalendarWeekGrid.js
import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';

const HOURS = Array.from({ length: 24 }, (_, h) => h);         // 00..23
const DAYS = Array.from({ length: 7 }, (_, i) => i);           // Mon..Sun indices

/**
 * Props:
 * - weekStart: Date (Monday)
 * - bookings: [{ id, start_at, duration_min, staff_id, service_name }]
 * - today: Date
 * - timeColWidth: number         (px width of the left time column)
 * - slotHeight: number           (px height for 30-min slot)  — default 26
 * - hourLabelStyle: TextStyle    (extra styles; we also offset a bit)
 * - initialScrollHour: number    (auto-scroll vertically to this hour)
 * - onPressBooking: (bk) => void
 */
export default function CalendarWeekGrid({
  weekStart,
  bookings = [],
  today = new Date(),
  timeColWidth = 56,
  slotHeight = 26,
  hourLabelStyle,
  initialScrollHour = 8,
  onPressBooking,
}) {
  const vref = useRef(null);

  // scroll to “initialScrollHour”
  useEffect(() => {
    const y = initialScrollHour * (slotHeight * 2); // 2 rows/hour
    requestAnimationFrame(() => vref.current?.scrollTo({ y, animated: false }));
  }, [initialScrollHour, slotHeight]);

  // normalize bookings into day columns with pixel geometry
  const dayCols = useMemo(() => {
    const start = new Date(weekStart);
    start.setHours(0, 0, 0, 0);
    const perDay = DAYS.map(() => []);
    for (const b of bookings) {
      const s = new Date(b.start_at);
      const dayIndex = ((s.getDay() + 6) % 7); // Monday=0
      if (dayIndex < 0 || dayIndex > 6) continue;

      const mins = s.getHours() * 60 + s.getMinutes();
      const top = Math.round((mins / 30) * slotHeight); // 30-min slots
      const height = Math.max(1, Math.round(((b.duration_min || 60) / 30) * slotHeight));

      perDay[dayIndex].push({ ...b, _top: top, _height: height });
    }
    // simple stacking (no overlap resolution beyond slight horizontal indent)
    perDay.forEach((items) => items.sort((a, b) => a._top - b._top));
    return perDay;
  }, [bookings, weekStart, slotHeight]);

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const headerDays = useMemo(() => {
    return DAYS.map((i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  return (
    <View style={[styles.wrap]}>
      {/* Day names header */}
      <View style={[styles.headerRow, { marginLeft: timeColWidth }]}>
        {headerDays.map((d, i) => {
          const active = isSameDay(d, today);
          return (
            <View key={i} style={[styles.headerCell]}>
              <Text style={[styles.headerDow]} numberOfLines={1}>
                {d.toLocaleDateString(undefined, { weekday: 'short' })}
              </Text>
              <Text style={[styles.headerDayNum, active && styles.headerDayNumActive]}>
                {d.getDate()}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Scrollable grid */}
      <ScrollView ref={vref} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row' }}>
          {/* Fixed time column (never overlapped) */}
          <View style={{ width: timeColWidth }}>
            {HOURS.map((h) => (
              <View key={h} style={{ height: slotHeight * 2, justifyContent: 'flex-start' }}>
                <Text
                  style={[
                    styles.hourLabel,
                    { transform: [{ translateY: -6 }] }, // lift a bit above the grid line
                    hourLabelStyle,
                  ]}
                >
                  {String(h).padStart(2, '0')}:00
                </Text>
              </View>
            ))}
          </View>

          {/* 7 day columns */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{}}
          >
            <View style={{ flexDirection: 'row' }}>
              {DAYS.map((i) => (
                <View key={i} style={[styles.dayCol, { height: slotHeight * 48 }]}>
                  {/* grid (rounded slots) */}
                  {Array.from({ length: 48 }, (_, r) => (
                    <View
                      key={r}
                      style={[
                        styles.slotCell,
                        {
                          height: slotHeight,
                          borderRadius: 8,
                          marginBottom: 2,
                        },
                      ]}
                    />
                  ))}

                  {/* bookings */}
                  {dayCols[i].map((bk, idx) => (
                    <Pressable
                      key={bk.id}
                      onPress={() => onPressBooking?.(bk)}
                      style={[
                        styles.booking,
                        {
                          top: bk._top,
                          height: bk._height - 2,
                          left: 4 + (idx % 2) * 6,    // tiny horizontal indent if stacked
                          right: 4,
                        },
                      ]}
                    >
                      <Text style={styles.bookingTxt} numberOfLines={1}>
                        {timeOf(bk.start_at)} • {bk.service_name || '—'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

function timeOf(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingBottom: 6,
    gap: 6,
  },
  headerCell: { flex: 1, alignItems: 'center' },
  headerDow: { fontWeight: '800', color: '#374151' },
  headerDayNum: {
    marginTop: 2,
    fontWeight: '900',
    color: '#111827',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  headerDayNumActive: {
    backgroundColor: '#111827',
    color: '#fff',
  },

  hourLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'right',
    paddingRight: 8,
  },

  dayCol: {
    width: 110,              // day column width (scrolls horizontally if small screens)
    position: 'relative',
    paddingHorizontal: 2,
  },

  slotCell: {
    borderWidth: 1,
    borderColor: '#EEF2F7',
    backgroundColor: '#FFFFFF',
  },

  booking: {
    position: 'absolute',
    backgroundColor: '#10B98133',
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  bookingTxt: { fontSize: 12, fontWeight: '800', color: '#065F46' },
});
