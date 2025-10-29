import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import BigBtn from '../components/BigBtn';
import Card from '../components/Card';
import { useSettings } from '../context/SettingsContext';
import { currency, dateLabel, timeLabel } from '../utils/format';

function BookingsScreen({ bookings, services, staff, onEdit, onDelete, showAlert, styles }) {
  const { t } = useSettings();
  const now = Date.now();

  const full = bookings.map((b) => {
    const start = new Date(b.start_at);
    const svc = services.find((s) => s.id === b.service_id) || null;
    const stf = staff.find((s) => s.id === b.staff_id) || null;
    return {
      ...b,
      start,
      serviceName: svc?.name ?? '-',
      servicePrice: svc?.price ?? 0,
      staffName: stf?.name ?? '-',
    };
  });

  const upcoming = full.filter((b) => b.start.getTime() >= now).sort((a, b) => a.start - b.start);
  const past = full.filter((b) => b.start.getTime() < now).sort((a, b) => b.start - a.start);

  const Row = ({ item }) => {
  // Check if booking is deleted or modified
  const isDeleted = item.status === 'deleted';
  const isModified = item.modified_at && item.created_at && 
    new Date(item.modified_at).getTime() !== new Date(item.created_at).getTime();
  
  return (
    <View style={[
      styles.scheduleCard,
      isDeleted && { opacity: 0.6, backgroundColor: '#F9FAFB' }
    ]}>
      <View style={{ flex: 1, gap: 4 }}>
        {/* Client Name with Status Badges */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Text style={styles.bookingClient}>{item.client_name}</Text>
          
          {/* DELETED BADGE */}
          {isDeleted && (
            <View style={[styles.statusBadge, styles.statusBadgeDeleted]}>
              <Text style={[styles.statusBadgeLabel, styles.statusBadgeLabelDeleted]}>Deleted</Text>
            </View>
          )}
          
          {/* MODIFIED BADGE */}
          {isModified && !isDeleted && (
            <View style={[styles.statusBadge, styles.statusBadgeModified]}>
              <Text style={[styles.statusBadgeLabel, styles.statusBadgeLabelModified]}>Modified</Text>
            </View>
          )}
        </View>

        <Text style={[
          styles.bookingSubBig,
          isDeleted && { color: '#9CA3AF' }
        ]}>
          {dateLabel(item.start)} {timeLabel(item.start)} | {item.duration_min ?? 60} min
        </Text>
        <Text style={[
          styles.bookingService,
          isDeleted && { color: '#D1D5DB' }
        ]}>
          {item.serviceName} | {currency(item.servicePrice)}
        </Text>
        <Text style={[
          styles.bookingSub,
          isDeleted && { color: '#D1D5DB' }
        ]}>{item.staffName}</Text>
        <Text style={[
          styles.bookingSub,
          isDeleted && { color: '#D1D5DB' }
        ]}>
          {item.client_phone}{item.client_email ? ` ? ${item.client_email}` : ''}
        </Text>
        {item.note ? (
          <Text style={[
            styles.bookingNote,
            isDeleted && { color: '#D1D5DB' }
          ]}>
            "{item.note}"
          </Text>
        ) : null}
      </View>

      <View style={{ justifyContent: 'center', gap: 8 }}>
        {!isDeleted && <BigBtn text={t('edit')} onPress={() => onEdit(item)} />}
        {!isDeleted && (
          <BigBtn
            text={t('delete')}
            kind="danger"
            onPress={() =>
              showAlert(
                t('delete'), 
                'Are you sure?', 
                'confirm', 
                [
                  { text: t('cancel'), style: 'cancel' },
                  { text: t('delete'), style: 'destructive', onPress: () => onDelete(item.id) }
                ]
              )
            }
          />
        )}
        {isDeleted && (
          <View style={{
            padding: 12,
            backgroundColor: '#F3F4F6',
            borderRadius: 8,
            alignItems: 'center',
          }}>
            <Text style={{
              fontSize: 12,
              color: '#6B7280',
              fontWeight: '600',
            }}>
              Deleted
            </Text>
          </View>
        )}
      </View>
    </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Card title={t('upcoming')}>
        {upcoming.length === 0 ? <Text style={styles.empty}></Text> : upcoming.map((b) => <Row key={b.id} item={b} />)}
      </Card>
      <Card title={t('past')}>
        {past.length === 0 ? <Text style={styles.empty}></Text> : past.map((b) => <Row key={b.id} item={b} />)}
      </Card>
    </ScrollView>
  );
}

export default BookingsScreen;

