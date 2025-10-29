import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { supabase } from '../supabase';
import { useSettings } from '../context/SettingsContext';
import BigBtn from '../components/BigBtn';
import Card from '../components/Card';
import Input from '../components/Input';
import KeyboardAwareScrollView from '../components/KeyboardAwareScrollView';

function ServicesScreen({ services, reload, showAlert, styles }) {
  const { t } = useSettings();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceHours, setNewServiceHours] = useState('1');
  const [newServiceMinutes, setNewServiceMinutes] = useState('0');

  const toLocal = (svc) => {
    const minutes = Math.max(0, Number(svc.duration_min ?? 60));
    const hoursPart = Math.floor(minutes / 60);
    const minutesPart = minutes % 60;
    return {
      ...svc,
      durationHours: String(hoursPart),
      durationMinutes: String(minutesPart),
    };
  };

  const [items, setItems] = useState(() => services.map(toLocal));
  useEffect(() => setItems(services.map(toLocal)), [services]);

  const updateLocal = (id, patch) =>
    setItems((prev) =>
      prev.map((svc) => {
        if (svc.id !== id) return svc;
        const next = { ...svc, ...patch };
        if (patch.durationHours !== undefined || patch.durationMinutes !== undefined) {
          const hoursText = next.durationHours ?? '';
          const minutesText = next.durationMinutes ?? '';
          const hoursVal = hoursText === '' ? 0 : Math.max(0, parseInt(hoursText, 10) || 0);
          let minutesVal = minutesText === '' ? 0 : Math.max(0, parseInt(minutesText, 10) || 0);
          minutesVal = Math.min(59, minutesVal);
          if (minutesText !== '' && String(minutesVal) !== minutesText) {
            next.durationMinutes = String(minutesVal);
          }
          next.duration_min = hoursVal * 60 + minutesVal;
        }
        return next;
      })
    );

  const confirmAddService = async () => {
    const name = newServiceName.replace(/\\/g, '').trim();
    if (!name) {
      showAlert('Error', 'Service name is required.', 'error');
      return;
    }
    const hours = Math.max(0, parseInt(newServiceHours ?? '', 10) || 0);
    const minutes = Math.max(0, Math.min(59, parseInt(newServiceMinutes ?? '', 10) || 0));
    const totalMinutes = hours * 60 + minutes;
    if (totalMinutes <= 0) {
      showAlert('Error', 'Duration must be greater than zero.', 'error');
      return;
    }

    const { error } = await supabase.from('services').insert({
      name,
      price: 0,
      duration_min: totalMinutes,
    });
    if (error) {
      showAlert('Error', error.message, 'error');
      return;
    }

    setNewServiceName('');
    setNewServiceHours('1');
    setNewServiceMinutes('0');
    setShowAddModal(false);
    showAlert('Success', t('serviceAdded'), 'success');
    reload();
  };

  const cancelAddService = () => {
    setNewServiceName('');
    setNewServiceHours('1');
    setNewServiceMinutes('0');
    setShowAddModal(false);
  };

  const saveOne = async (svc) => {
    const hours = Math.max(0, parseInt(svc.durationHours ?? '', 10) || 0);
    const minutes = Math.max(0, Math.min(59, parseInt(svc.durationMinutes ?? '', 10) || 0));
    const totalMinutes = hours * 60 + minutes;
    if (totalMinutes <= 0) {
      showAlert('Error', 'Duration must be greater than zero.', 'error');
      return;
    }

    const payload = {
      name: (svc.name ?? '').replace(/\\/g, '').trim(),
      duration_min: totalMinutes,
    };

    const { error } = await supabase.from('services').update(payload).eq('id', svc.id);
    if (error) {
      showAlert('Error', error.message, 'error');
      return;
    }

    showAlert('Success', t('saved'), 'success');
    reload();
  };

  const remove = async (id) => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) {
      showAlert('Error', error.message, 'error');
      return;
    }
    showAlert('Success', t('serviceRemoved'), 'success');
    reload();
  };

  return (
    <>
      <KeyboardAwareScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 48 }]}>
        <Card title={t('editServices')}>
          {items.length === 0 ? (
            <Text style={styles.empty}></Text>
          ) : (
            items.map((svc) => (
              <View key={svc.id} style={styles.serviceBlock}>
                <Text style={[styles.label, styles.serviceLabel]}>{t('typeOfService')}</Text>
                <Input
                  baseStyle={styles.input}
                  focusedStyle={styles.inputFocused}
                  style={styles.serviceInput}
                  value={svc.name ?? ''}
                  onChangeText={(txt) => updateLocal(svc.id, { name: txt })}
                  placeholder={t('typeOfService')}
                />

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, styles.serviceLabel]}>{t('durationHours')}</Text>
                    <Input
                      baseStyle={styles.input}
                      focusedStyle={styles.inputFocused}
                      style={styles.serviceInput}
                      value={svc.durationHours}
                      onChangeText={(txt) => updateLocal(svc.id, { durationHours: txt.replace(/[^\d]/g, '') })}
                      keyboardType="number-pad"
                      placeholder="1"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, styles.serviceLabel]}>{t('durationMinutes')}</Text>
                    <Input
                      baseStyle={styles.input}
                      focusedStyle={styles.inputFocused}
                      style={styles.serviceInput}
                      value={svc.durationMinutes}
                      onChangeText={(txt) => updateLocal(svc.id, { durationMinutes: txt.replace(/[^\d]/g, '') })}
                      keyboardType="number-pad"
                      placeholder="30"
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                  <BigBtn text={t('save')} onPress={() => saveOne(svc)} />
                  <BigBtn text={t('delete')} kind="danger" onPress={() => remove(svc.id)} />
                </View>

                <View style={styles.divider} />
              </View>
            ))
          )}

          <View style={{ marginTop: 8 }}>
            <BigBtn kind="primary" text={t('addService')} onPress={() => setShowAddModal(true)} />
          </View>
        </Card>

        <View style={{ height: 24 }} />
      </KeyboardAwareScrollView>

      <Modal visible={showAddModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={cancelAddService}>
          <Pressable style={styles.modalContent} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>{t('addService')}</Text>

            <Text style={[styles.label, styles.serviceLabel]}>{t('typeOfService')}</Text>
            <Input
              baseStyle={styles.input}
              focusedStyle={styles.inputFocused}
              style={styles.serviceInput}
              value={newServiceName}
              onChangeText={setNewServiceName}
              placeholder="Enter service name"
            />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, styles.serviceLabel]}>{t('durationHours')}</Text>
                <Input
                  baseStyle={styles.input}
                  focusedStyle={styles.inputFocused}
                  style={styles.serviceInput}
                  value={newServiceHours}
                  onChangeText={(txt) => setNewServiceHours(txt.replace(/[^\d]/g, ''))}
                  keyboardType="number-pad"
                  placeholder="1"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, styles.serviceLabel]}>{t('durationMinutes')}</Text>
                <Input
                  baseStyle={styles.input}
                  focusedStyle={styles.inputFocused}
                  style={styles.serviceInput}
                  value={newServiceMinutes}
                  onChangeText={(txt) => {
                    const num = parseInt(txt.replace(/[^\d]/g, ''), 10) || 0;
                    setNewServiceMinutes(String(Math.min(59, num)));
                  }}
                  keyboardType="number-pad"
                  placeholder="0"
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <BigBtn text={t('save')} onPress={confirmAddService} />
              <BigBtn text={t('cancel')} kind="danger" onPress={cancelAddService} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export default ServicesScreen;