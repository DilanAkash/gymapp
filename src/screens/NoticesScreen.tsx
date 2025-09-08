// src/screens/NoticesScreen.tsx
import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, Button, Alert, FlatList, StyleSheet, TouchableOpacity } from 'react-native'
import { supabase } from '../lib/supabase'

type Notice = {
  id: string
  title: string
  message: string
  starts_at: string
  expires_at: string
  created_at: string
}

export default function NoticesScreen() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(false)
  const [showActiveOnly, setShowActiveOnly] = useState(true)

  const loadNotices = async () => {
    setLoading(true)
    const base = showActiveOnly
      ? supabase.from('v_active_notices').select('*')
      : supabase.from('notices').select('*')

    const { data, error } = await base.order('created_at', { ascending: false })
    if (error) Alert.alert('Error', error.message)
    else setNotices((data ?? []) as Notice[])
    setLoading(false)
  }

  useEffect(() => {
    loadNotices()
  }, [showActiveOnly])

  const createNotice = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Validation', 'Please enter a title and message')
      return
    }
    const { error } = await supabase.rpc('create_notice_24h', {
      p_title: title.trim(),
      p_message: message.trim(),
      p_image_url: null,
      p_starts_at: new Date().toISOString(),
    })
    if (error) {
      Alert.alert('Error', error.message)
      return
    }
    setTitle('')
    setMessage('')
    Alert.alert('Success', 'Notice created for 24 hours')
    loadNotices()
  }

  const deleteNotice = async (id: string) => {
    const { error } = await supabase.from('notices').delete().eq('id', id)
    if (error) {
      Alert.alert('Error', error.message)
      return
    }
    loadNotices()
  }

  const NoticeRow = ({ item }: { item: Notice }) => {
    const active =
      new Date(item.starts_at).getTime() <= Date.now() &&
      Date.now() <= new Date(item.expires_at).getTime()

    return (
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.titleText}>{item.title}</Text>
          <Text style={styles.msgText}>{item.message}</Text>
          <Text style={styles.meta}>
            {new Date(item.starts_at).toLocaleString()} → {new Date(item.expires_at).toLocaleString()} {active ? ' • ACTIVE' : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={() => deleteNotice(item.id)} style={styles.deleteBtn}>
          <Text style={{ color: 'white', fontWeight: '700' }}>Delete</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Notices</Text>

      <View style={styles.card}>
        <Text style={styles.cardHeader}>Create 24h Notice</Text>
        <TextInput
          style={styles.input}
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
          placeholder="Message"
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <Button title="Post notice (24h)" onPress={createNotice} />
      </View>

      <View style={styles.toggleRow}>
        <Button
          title={showActiveOnly ? 'Showing: ACTIVE • Tap to show ALL' : 'Showing: ALL • Tap to show ACTIVE'}
          onPress={() => setShowActiveOnly(!showActiveOnly)}
        />
        <View style={{ width: 10 }} />
        <Button title={loading ? 'Refreshing…' : 'Refresh'} onPress={loadNotices} />
      </View>

      <FlatList
        data={notices}
        keyExtractor={(n) => n.id}
        renderItem={NoticeRow}
        ListEmptyComponent={
          <Text style={{ color: '#9aa4b2', textAlign: 'center', marginTop: 16 }}>
            {showActiveOnly ? 'No active notices.' : 'No notices yet.'}
          </Text>
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f1a', padding: 16 },
  header: { color: 'white', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  card: { backgroundColor: '#111828', borderRadius: 12, padding: 12, marginBottom: 12 },
  cardHeader: { color: 'white', fontWeight: '700', marginBottom: 8 },
  input: { backgroundColor: 'white', borderRadius: 8, padding: 10, marginBottom: 10 },
  toggleRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 12, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomColor: '#22293a', borderBottomWidth: 1 },
  titleText: { color: 'white', fontWeight: '700', marginBottom: 4 },
  msgText: { color: '#d8dee9' },
  meta: { color: '#9aa4b2', marginTop: 4, fontSize: 12 },
  deleteBtn: { backgroundColor: '#b91c1c', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, marginLeft: 10 },
})
