import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import BaseInput from './Input';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../supabase';

function SettingsModal({
  open,
  onClose,
  onSignOut,
  onRequestEmailChange,
  user,
  currentUserRole,
  styles,
}) {
  const { t, lang, setLang } = useSettings();
  const [newEmail, setNewEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState('personal');
  const [profiles, setProfiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: '', email: '', phone: '', role: 'staff' });

  const isAdmin = currentUserRole === 'admin' || user?.email?.toLowerCase() === 'josemunoz@outlook.com.au';

  const Input = (props) => (
    <BaseInput baseStyle={styles.input} focusedStyle={styles.inputFocused} {...props} />
  );

  useEffect(() => {
    if (open && user) {
      setDisplayName(user.user_metadata?.full_name || '');
      if (isAdmin) {
        loadProfiles();
      }
    }
  }, [open, user, isAdmin]);

  const loadProfiles = async () => {
    let data;
    let error;
    ({ data, error } = await supabase
      .from('profiles')
      .select('user_id, full_name, role, phone, email')
      .order('full_name', { ascending: true }));

    if (error?.code === '42703') {
      const retry = await supabase
        .from('profiles')
        .select('user_id, full_name, role, phone')
        .order('full_name', { ascending: true });
      data = retry.data;
    } else if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    setProfiles(data || []);
  };

  const handleSaveDisplayName = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: displayName.trim() },
      });

      if (error) throw error;

      if (user?.id) {
        await supabase
          .from('profiles')
          .update({ full_name: displayName.trim() })
          .eq('user_id', user.id);
      }

      Alert.alert('Success', 'Display name updated successfully');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const setRole = async (user_id, nextRole) => {
    const { error } = await supabase.from('profiles').update({ role: nextRole }).eq('user_id', user_id);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    loadProfiles();
  };

  const deleteProfile = async (user_id) => {
    Alert.alert('Confirm Delete', 'Delete this profile record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('profiles').delete().eq('user_id', user_id);
          if (error) {
            Alert.alert('Error', error.message);
            return;
          }
          loadProfiles();
        },
      },
    ]);
  };

  const addUser = async () => {
    if (!addForm.full_name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .insert({
        user_id: `temp-${Date.now()}`,
        full_name: addForm.full_name.trim(),
        email: addForm.email.trim() || null,
        phone: addForm.phone.trim() || null,
        role: addForm.role,
      })
      .select();

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    setAddForm({ full_name: '', email: '', phone: '', role: 'staff' });
    setAddUserOpen(false);
    loadProfiles();
  };

  const filteredProfiles = profiles.filter(
    (p) =>
      (p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.phone || '').toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (!open) return null;

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBack} onPress={onClose}>
        <Pressable style={styles.settingsModalCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.settingsModalHeader}>
            <Text style={styles.settingsModalTitle}>{t('profileSettings')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.settingsCloseBtn}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          {isAdmin ? (
            <View style={styles.settingsTabs}>
              <Pressable
                style={[styles.settingsTab, activeTab === 'personal' && styles.settingsTabActive]}
                onPress={() => setActiveTab('personal')}
              >
                <Ionicons name="person-outline" size={18} color={activeTab === 'personal' ? '#1d342e' : '#6B7280'} />
                <Text
                  style={[styles.settingsTabText, activeTab === 'personal' && styles.settingsTabTextActive]}
                >
                  Personal
                </Text>
              </Pressable>
              <Pressable
                style={[styles.settingsTab, activeTab === 'admin' && styles.settingsTabActive]}
                onPress={() => setActiveTab('admin')}
              >
                <Ionicons name="shield-outline" size={18} color={activeTab === 'admin' ? '#1d342e' : '#6B7280'} />
                <Text style={[styles.settingsTabText, activeTab === 'admin' && styles.settingsTabTextActive]}>
                  Admin
                </Text>
              </Pressable>
            </View>
          ) : null}

          <ScrollView
            style={styles.settingsScrollView}
            contentContainerStyle={styles.settingsScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'personal' ? (
              <View style={styles.settingsSection}>
                <View style={styles.settingsGroup}>
                  <Text style={styles.settingsLabel}>{t('name') || 'Display Name'}</Text>
                  <Input
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Your name"
                    autoCapitalize="words"
                  />
                  <TouchableOpacity
                    style={styles.settingsBtn}
                    onPress={handleSaveDisplayName}
                    disabled={saving}
                  >
                    <Text style={styles.settingsBtnText}>{saving ? 'Saving...' : t('save')}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.settingsGroup}>
                  <Text style={styles.settingsLabel}>{t('language')}</Text>
                  <View style={styles.languageButtons}>
                    <TouchableOpacity
                      style={[styles.langBtn, lang === 'pl' && styles.langBtnActive]}
                      onPress={() => setLang('pl')}
                    >
                      <Text style={[styles.langBtnText, lang === 'pl' && styles.langBtnTextActive]}>PL</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}
                      onPress={() => setLang('en')}
                    >
                      <Text style={[styles.langBtnText, lang === 'en' && styles.langBtnTextActive]}>EN</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.settingsGroup}>
                  <Text style={styles.settingsLabel}>{t('changeEmail') || 'Change Email'}</Text>
                  <Input
                    value={newEmail}
                    onChangeText={setNewEmail}
                    placeholder="new@email.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  <TouchableOpacity
                    style={styles.settingsBtn}
                    onPress={() => onRequestEmailChange(newEmail)}
                  >
                    <Text style={styles.settingsBtnText}>Send Change Link</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.settingsGroup}>
                  <TouchableOpacity style={styles.signOutBtn} onPress={onSignOut}>
                    <Ionicons name="log-out-outline" size={20} color="#fff" />
                    <Text style={styles.signOutBtnText}>{t('signOut')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {activeTab === 'admin' && isAdmin ? (
              <View style={styles.settingsSection}>
                <View style={styles.adminHeader}>
                  <Text style={styles.adminTitle}>{t('users') || 'User Management'}</Text>
                  <TouchableOpacity style={styles.addUserBtn} onPress={() => setAddUserOpen(true)}>
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={styles.addUserBtnText}>Add User</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.searchBar}>
                  <Ionicons name="search" size={18} color="#6B7280" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search users..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.profilesList}>
                  {filteredProfiles.length === 0 ? (
                    <Text style={styles.emptyStateText}>{t('noUsersFound') || 'No users found.'}</Text>
                  ) : (
                    filteredProfiles.map((p) => (
                      <View key={p.user_id} style={styles.userCard}>
                        <View style={styles.userInfo}>
                          <Text style={styles.userCardName}>{p.full_name || 'No name'}</Text>
                          <Text style={styles.userCardEmail}>{p.email || 'No email'}</Text>
                          <Text style={styles.userCardPhone}>{p.phone || 'No phone'}</Text>
                        </View>

                        <View style={styles.userActions}>
                          <View style={styles.roleButtons}>
                            <TouchableOpacity
                              style={[styles.roleToggle, p.role === 'admin' && styles.roleToggleActive]}
                              onPress={() => setRole(p.user_id, 'admin')}
                            >
                              <Text style={[styles.roleToggleText, p.role === 'admin' && styles.roleToggleTextActive]}>
                                Admin
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.roleToggle, p.role === 'staff' && styles.roleToggleActive]}
                              onPress={() => setRole(p.user_id, 'staff')}
                            >
                              <Text style={[styles.roleToggleText, p.role === 'staff' && styles.roleToggleTextActive]}>
                                Staff
                              </Text>
                            </TouchableOpacity>
                          </View>
                          <TouchableOpacity style={styles.deleteUserBtn} onPress={() => deleteProfile(p.user_id)}>
                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </View>

                <Modal visible={addUserOpen} transparent animationType="slide">
                  <Pressable style={styles.modalBack} onPress={() => setAddUserOpen(false)}>
                    <Pressable style={styles.addUserModal} onPress={(e) => e.stopPropagation()}>
                      <View style={styles.addUserHeader}>
                        <Text style={styles.addUserTitle}>{t('addUser')}</Text>
                        <TouchableOpacity onPress={() => setAddUserOpen(false)}>
                          <Ionicons name="close" size={24} color="#111827" />
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.settingsLabel}>{t('name')}</Text>
                      <Input
                        value={addForm.full_name}
                        onChangeText={(txt) => setAddForm({ ...addForm, full_name: txt })}
                        placeholder="Full name"
                      />

                      <Text style={styles.settingsLabel}>{t('emailProfiles')}</Text>
                      <Input
                        value={addForm.email}
                        onChangeText={(txt) => setAddForm({ ...addForm, email: txt })}
                        placeholder="email@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />

                      <Text style={styles.settingsLabel}>{t('phoneProfiles')}</Text>
                      <Input
                        value={addForm.phone}
                        onChangeText={(txt) => setAddForm({ ...addForm, phone: txt })}
                        placeholder="+48 123 456 789"
                        keyboardType="phone-pad"
                      />

                      <Text style={styles.settingsLabel}>{t('role')}</Text>
                      <View style={styles.pickerWrapTight}>
                        <Picker
                          selectedValue={addForm.role}
                          onValueChange={(v) => setAddForm({ ...addForm, role: v })}
                          style={styles.yearPickerResponsive}
                        >
                          <Picker.Item label="Staff" value="staff" />
                          <Picker.Item label="Admin" value="admin" />
                        </Picker>
                      </View>

                      <View style={styles.addUserActions}>
                        <TouchableOpacity style={styles.settingsBtnSecondary} onPress={() => setAddUserOpen(false)}>
                          <Text style={styles.settingsBtnSecondaryText}>{t('cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.settingsBtn} onPress={addUser}>
                          <Text style={styles.settingsBtnText}>{t('save')}</Text>
                        </TouchableOpacity>
                      </View>
                    </Pressable>
                  </Pressable>
                </Modal>
              </View>
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default SettingsModal;
