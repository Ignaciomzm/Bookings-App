import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const HOURS = Array.from({ length: 13 }, (_, i) => 8 + i); // 08:00 - 20:00

export default function CalendarWeek({ weekStart, bookings, staff, onEdit }) {
  const days = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [weekStart]);

  const staffColor = useMemo(() => {
    const map = {};
    staff.forEach(s => { map[s.id] = s.color || '#5C6BC0'; });
    return map;
  }, [staff]);

  const byDay = useMemo(() => {
    const map = {};
    days.forEach((_, i) => { map[i] = []; });
    bookings.forEach(b => {
      const d = new Date(b.start_at);
      const idx = (d.getDay() + 6) % 7; // Monday=0
      if (map[idx]) map[idx].push(b);
    });
    Object.values(map).forEach(list => list.sort((a, b) => new Date(a.start_at) - new Date(b.start_at)));
    return map;
  }, [bookings, days]);

  return (
    <View style={s.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row' }}>
          {/* Hours */}
          <View style={s.hoursCol}>
            {HOURS.map(h => (
              <View key={h} style={s.hourRow}>
                <Text style={s.hourText}>{String(h).padStart(2,'0')}:00</Text>
              </View>
            ))}
          </View>

          {/* 7 day columns without weekday labels */}
          {days.map((_, dayIdx) => (
            <View key={dayIdx} style={s.dayCol}>
              {HOURS.map(h => <View key={h} style={s.cell} />)}
              {byDay[dayIdx].map(b => {
                const start = new Date(b.start_at);
                const dur = Number(b.duration_min || 60);
                const startHour = start.getHours() + start.getMinutes() / 60;
                const topPct = ((startHour - HOURS[0]) / (HOURS.length)) * 100;
                const heightPct = (dur / 60) * (100 / HOURS.length);
                const color = staffColor[b.staff_id] || '#5C6BC0';
                return (
                  <View
                    key={b.id}
                    style={[
                      s.block,
                      {
                        top: `${topPct}%`,
                        height: `${heightPct}%`,
                        borderColor: color + '88',
                        backgroundColor: color + '22',
                      },
                    ]}
                    onTouchEnd={() => onEdit?.(b)}
                  >
                    <Text style={s.blockText}>
                      {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {b.client_name}
                    </Text>
                    {b.service_name ? <Text style={[s.blockText, { opacity: 0.8 }]}>{b.service_name}</Text> : null}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  hoursCol: { width: 54, backgroundColor: '#FAFBFC', borderRightWidth: 1, borderColor: '#E5E7EB' },
  hourRow: { height: 60, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 2 },
  hourText: { fontSize: 11, color: '#6B7280' },
  dayCol: { width: 160, height: HOURS.length * 60, position: 'relative', backgroundColor: '#fff' },
  cell: { height: 60, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  block: { position: 'absolute', left: 6, right: 6, borderWidth: 2, borderRadius: 10, padding: 6 },
  blockText: { fontSize: 11, fontWeight: '700', color: '#111827' },
});
