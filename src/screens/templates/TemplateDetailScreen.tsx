// src/screens/templates/TemplateDetailScreen.tsx
import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, TextInput, Button, Alert, TouchableOpacity, StyleSheet } from 'react-native'
import { supabase } from '../../lib/supabase'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { TemplateStackParamList } from '../../nav/AdminTabs'

type Day = {
  id: string
  day_index: number
  name: string | null
  created_at: string
}

type Props = NativeStackScreenProps<TemplateStackParamList, 'TemplateDetail'>

export default function TemplateDetailScreen({ route, navigation }: Props) {
  const { templateId, name } = route.params
  const [days, setDays] = useState<Day[]>([])
  const [dayName, setDayName] = useState('')
  const [dayIndex, setDayIndex] = useState('1')

  const loadDays = async () => {
    const { data, error } = await supabase
      .from('workout_days')
      .select('*')
      .eq('template_id', templateId)
      .order('day_index', { ascending: true })
    if (error) Alert.alert('Error', error.message)
    else setDays((data ?? []) as Day[])
  }

  useEffect(() => {
    const unsub = navigation.addListener('focus', loadDays)
    return unsub
  }, [navigation])

  const createDay = async () => {
    const idx = parseInt(dayIndex, 10)
    if (isNaN(idx)) {
      Alert.alert('Validation', 'Day index must be a number')
      return
    }
    const { error } = await supabase.from('workout_days').insert({
      template_id: templateId,
      day_index: idx,
      name: dayName || null,
    })
    if (error) {
      Alert.alert('Error', error.message)
      return
    }
    setDayName(''); setDayIndex('1')
    loadDays()
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{name} – Days</Text>

      <View style={styles.card}>
        <TextInput style={styles.input} placeholder="Day index (1..n)" value={dayIndex} onChangeText={setDayIndex} />
        <TextInput style={styles.input} placeholder="Day name (optional)" value={dayName} onChangeText={setDayName} />
        <Button title="Add Day" onPress={createDay} />
      </View>

      <FlatList
        data={days}
        keyExtractor={(d) => d.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('DayDetail', { dayId: item.id, name: item.name ?? `Day ${item.day_index}` })}
          >
            <Text style={styles.name}>{item.name ?? `Day ${item.day_index}`}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No days yet.</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f1a', padding: 16 },
  header: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  card: { backgroundColor: '#111828', borderRadius: 12, padding: 12, marginBottom: 12 },
  input: { backgroundColor: 'white', borderRadius: 8, padding: 10, marginBottom: 8 },
  row: { paddingVertical: 12, borderBottomColor: '#22293a', borderBottomWidth: 1 },
  name: { color: 'white', fontWeight: '700' },
  empty: { color: '#9aa4b2', textAlign: 'center', marginTop: 20 },
})
