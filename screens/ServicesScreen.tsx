// app/screens/ServicesScreen.tsx
import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";

// ---- tiny i18n (EN/PL) ----
type Locale = "en" | "pl";
const strings = {
  en: {
    title: "Services",
    subtitle: "Edit services, prices & default durations",
    price: "Price",
    duration: "Duration (min)",
    addService: "+ Add service",
  },
  pl: {
    title: "Usługi",
    subtitle: "Edytuj usługi, ceny i domyślne czasy trwania",
    price: "Cena",
    duration: "Czas (min)",
    addService: "+ Dodaj usługę",
  },
} as const;

type Service = { id: string; name: string; price: number; duration: number };

export default function ServicesScreen({
  locale = "pl", // change default if you want English by default: "en"
}: {
  locale?: Locale;
}) {
  const t = useMemo(() => strings[locale], [locale]);

  const [services, setServices] = useState<Service[]>([
    { id: "1", name: "—", price: 520, duration: 60 },
    { id: "2", name: "—", price: 30, duration: 60 },
    { id: "3", name: "—", price: 300, duration: 60 },
    { id: "4", name: "—", price: 80, duration: 60 },
    { id: "5", name: "—", price: 150, duration: 60 },
  ]);

  const updateService = (id: string, patch: Partial<Service>) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const addService = () => {
    setServices((prev) => [
      ...prev,
      { id: String(Date.now()), name: "", price: 0, duration: 30 },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.pageTitle}>{t.title}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.subtitle}</Text>

          {/* header labels (flex so PL fits) */}
          <View style={styles.headerRow}>
            <View style={[styles.colName]}>
              <Text style={styles.headerText}>{locale === "pl" ? "Nazwa usługi" : "Service name"}</Text>
            </View>
            <View style={styles.colPrice}>
              <Text style={styles.headerText}>{t.price}</Text>
            </View>
            <View style={styles.colDur}>
              <Text style={styles.headerText}>{t.duration}</Text>
            </View>
          </View>

          {services.map((s) => (
            <View key={s.id} style={styles.row}>
              {/* Service name (stretches; leaves room for long Polish text) */}
              <TextInput
                value={s.name}
                placeholder={locale === "pl" ? "np. Strzyżenie" : "e.g. Haircut"}
                onChangeText={(v) => updateService(s.id, { name: v })}
                style={styles.inputName}
                placeholderTextColor="#9AA3AF"
              />

              {/* COMPACT numeric boxes */}
              <TextInput
                value={String(s.price)}
                keyboardType="numeric"
                onChangeText={(v) =>
                  updateService(s.id, { price: Number(v.replace(/[^0-9]/g, "")) || 0 })
                }
                style={styles.inputCompact}
                placeholder="0"
                placeholderTextColor="#9AA3AF"
              />
              <TextInput
                value={String(s.duration)}
                keyboardType="numeric"
                onChangeText={(v) =>
                  updateService(s.id, { duration: Number(v.replace(/[^0-9]/g, "")) || 0 })
                }
                style={styles.inputCompact}
                placeholder="30"
                placeholderTextColor="#9AA3AF"
              />
            </View>
          ))}

          <TouchableOpacity onPress={addService} style={styles.addBtn}>
            <Text style={styles.addBtnText}>{t.addService}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const BORDER = "#E5E7EB";
const TXT = "#0F172A";
const SUBTXT = "#6B7280";
const BG = "#F8FAFC";
const CARD = "#FFFFFF";

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: TXT,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: TXT,
    marginBottom: 10,
    textAlign: "left",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    marginBottom: 6,
  },
  headerText: {
    fontSize: 12,
    color: SUBTXT,
    fontWeight: "600",
  },
  colName: { flex: 1, paddingRight: 8 },
  colPrice: { width: 92, alignItems: "center" },
  colDur: { width: 92, alignItems: "center" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    backgroundColor: "#FFF",
  },

  // Wider input for Polish names; keeps nice margins
  inputName: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginRight: 8,
    fontSize: 15,
    color: TXT,
    backgroundColor: "#F9FAFB",
  },

  // *** Compact numeric input ***
  inputCompact: {
    width: 84,            // Compact width to “just show numbers”
    height: 44,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    textAlign: "center",
    fontSize: 16,
    color: TXT,
    backgroundColor: "#F9FAFB",
    ...(Platform.OS === "android" ? { paddingVertical: 6 } : {}),
    marginLeft: 8,
  },

  addBtn: {
    marginTop: 10,
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  addBtnText: {
    color: TXT,
    fontWeight: "700",
  },
});
