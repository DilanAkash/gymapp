// src/screens/AttendanceScreen.tsx
import React, { useEffect, useRef, useState } from 'react'
import { View, Text, FlatList, Button, Alert, StyleSheet } from 'react-native'
import { supabase } from '../lib/supabase'
import QRCode from 'react-native-qrcode-svg'
import * as Print from 'expo-print'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'

type Session = {
  id: string
  member_name: string
  check_in_at: string
  check_out_at: string | null
  duration_minutes: number
  location_name?: string
}

export default function AttendanceScreen() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [gymName, setGymName] = useState<string>('Your Gym') // could later come from Settings table
  const qrRef = useRef<any>(null)

  // ---------- DATA LOADERS ----------
  const fetchSessions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('v_attendance_sessions')
      .select('*')
      .order('check_in_at', { ascending: false })
      .limit(30)

    if (error) Alert.alert('Error', error.message)
    else setSessions((data ?? []) as Session[])
    setLoading(false)
  }

  const fetchToken = async () => {
    const { data, error } = await supabase
      .from('attendance_locations')
      .select('current_token')
      .eq('name', 'Front Desk')
      .maybeSingle()

    if (error) {
      Alert.alert('Error', error.message)
      return
    }
    setToken(data?.current_token ?? null)
  }

  const getFrontDeskId = async (): Promise<string> => {
    const { data, error } = await supabase
      .from('attendance_locations')
      .select('id')
      .eq('name', 'Front Desk')
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Front Desk location not found')
    return data.id as string
  }

  const rotateToken = async () => {
    try {
      const locId = await getFrontDeskId()
      const { data, error } = await supabase.rpc('rotate_location_token', {
        p_location_id: locId,
      })
      if (error) {
        Alert.alert('Error', error.message)
        return
      }
      const newToken =
        Array.isArray(data) && data.length > 0 ? (data[0] as any).new_token : null
      if (newToken) {
        setToken(newToken)
        Alert.alert('Success', 'Token rotated')
      } else {
        await fetchToken()
        Alert.alert('Success', 'Token rotated')
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to rotate token')
    }
  }

  useEffect(() => {
    fetchSessions()
    fetchToken()
  }, [])

  // ---------- UTIL: CSV EXPORT ----------
  const exportCsv = async () => {
    if (!sessions.length) {
      Alert.alert('No data', 'There are no sessions to export yet.')
      return
    }
    const header = [
      'member_name',
      'check_in_at',
      'check_out_at',
      'duration_minutes',
      'location_name',
    ]
    const rows = sessions.map(s => [
      csvSafe(s.member_name),
      new Date(s.check_in_at).toISOString(),
      s.check_out_at ? new Date(s.check_out_at).toISOString() : '',
      String(s.duration_minutes ?? ''),
      s.location_name ?? 'Front Desk',
    ])

    const csv = [header, ...rows].map(r => r.join(',')).join('\n')
    const fileUri = FileSystem.documentDirectory + `attendance_${Date.now()}.csv`
    await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 })

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Attendance CSV' })
    } else {
      Alert.alert('Saved', `CSV saved to: ${fileUri}`)
    }
  }

  const csvSafe = (val: string) => {
    // wrap in quotes and escape quotes
    const v = (val ?? '').replace(/"/g, '""')
    return `"${v}"`
  }

  // ---------- UTIL: POSTER (PDF) ----------
  // Convert QR to base64 PNG, inject into HTML, print to PDF, then share/save.
  const generatePosterPdf = async () => {
    try {
      if (!token || !qrRef.current) {
        Alert.alert('Missing QR', 'No token yet. Try rotating once.')
        return
      }

      const qrPngBase64: string = await new Promise((resolve, reject) => {
        try {
          qrRef.current.toDataURL((data: string) => resolve(data))
        } catch (e) {
          reject(e)
        }
      })

      const today = new Date().toLocaleDateString()
      const html = `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${gymName} • Front Desk QR</title>
<style>
  @page { size: A4; margin: 20mm; }
  body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; color: #111; }
  .wrap { text-align: center; }
  .title { font-size: 28px; font-weight: 800; margin: 10px 0 4px; }
  .sub { font-size: 14px; color: #555; margin-bottom: 24px; }
  .qr { margin: 18px auto; width: 300px; height: 300px; }
  .hint { font-size: 16px; margin-top: 16px; }
  .foot { margin-top: 40px; font-size: 12px; color: #777; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="title">${escapeHtml(gymName)}</div>
    <div class="sub">Front Desk Check-In / Check-Out</div>
    <img class="qr" src="data:image/png;base64,${qrPngBase64}" />
    <div class="hint">Please scan this code at entry and when leaving.</div>
    <div class="foot">Printed on ${escapeHtml(today)} • Rotate this QR in the Admin app to invalidate old codes.</div>
  </div>
</body>
</html>
      `

      const file = await Print.printToFileAsync({ html })
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'Share QR Poster' })
      } else {
        Alert.alert('Saved', `Poster created at: ${file.uri}`)
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to create poster')
    }
  }

  const escapeHtml = (s: string) => s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c] as string))

  // ---------- UI ----------
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
        <Button title={loading ? 'Refreshing…' : 'Refresh'} onPress={fetchSessions} />
        <Button title="Export CSV" onPress={exportCsv} />
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.member}>{item.member_name}</Text>
            <Text style={styles.time}>
              In: {new Date(item.check_in_at).toLocaleTimeString()}
              {item.check_out_at
                ? `   Out: ${new Date(item.check_out_at).toLocaleTimeString()}`
                : '   (open)'}
            </Text>
            <Text style={styles.duration}>{item.duration_minutes} mins</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ color: '#9aa4b2', textAlign: 'center', marginTop: 16 }}>
            No sessions yet.
          </Text>
        }
      />

      <View style={{ marginTop: 20, alignItems: 'center' }}>
        <Text style={styles.title}>Front Desk QR</Text>
        {token ? (
          <QRCode value={token} size={180} getRef={(ref: any) => (qrRef.current = ref)} />
        ) : (
          <Text style={styles.text}>No token</Text>
        )}
        <View style={{ height: 8 }} />
        <View style={{ gap: 8, width: 260 }}>
          <Button title="Rotate Token" onPress={rotateToken} />
          <Button title="Generate Poster (PDF)" onPress={generatePosterPdf} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#0b0f1a' },
  title: { fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 10, textAlign: 'center' },
  row: { paddingVertical: 10, borderBottomColor: '#2a2f3a', borderBottomWidth: 1 },
  member: { color: 'white', fontWeight: '600' },
  time: { color: '#d8dee9', marginTop: 2 },
  duration: { color: '#9aa4b2', marginTop: 2 },
  text: { color: 'white' },
})
