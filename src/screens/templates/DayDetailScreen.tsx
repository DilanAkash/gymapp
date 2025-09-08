// src/screens/templates/DayDetailScreen.tsx
import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, TextInput, Button, Alert, StyleSheet } from 'react-native'
import { supabase } from '../../lib/supabase'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { TemplateStackParamList } from '../../nav/AdminTabs'

type Exercise = {
  id: string
  name: string
  muscle_group: string | null
  sets: number | null
  reps: string | null
  rest_seconds: number | null
  notes: string | null
  order_index: number
}

type Props = NativeStackScreenProps<TemplateStackParamList, 'DayDetail'>

export default function DayDetailScreen({ route }: Props) {
  const { dayId, name } = route.params
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [form, setForm] = useState({
    name: '',
    muscle: '',
    sets: '',
    reps: '',
    rest: '',
    notes: '',
    order: '',
  })

  const loadExercises = async () => {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('day_id', dayId)
      .order('order_index', { ascending: true })
    if (error) Alert.alert('Error', error.message)
    else setExercises((data ?? []) as Exercise[])
  }

  useEffect(() => {
    loadExercises()
  }, [])

  const addExercise = async () => {
    if (!form.name.trim()) {
      Alert.alert('Validation', 'Exercise name is required')
      return
    }
    const { error } = await supabase.from('workout_exercises').insert({
      day_id: dayId,
      name: form.name,
      muscle_group: form.muscle || null,
      sets: form.sets ? parseInt(form.sets, 10) : null,
      reps: form.reps || null,
      rest_seconds: form.rest ? parseInt(form.rest, 10) : null,
      notes: form.notes || null,
      order_index: form.order ? parseInt(form.order, 10) : 0,
    })
    if (error) {
      Alert.alert('Error', error.message)
      return
    }
    setForm({ name: '', muscle: '', sets: '', reps: '', rest: '', notes: '', order: '' })
    loadExercises()
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{name} – Exercises</Text>

      <View style={styles.card}>
        <TextInput style={styles.input} placeholder="Exercise name" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
        <TextInput style={styles.input} placeholder="Muscle group" value={form.muscle} onChangeText={(t) => setForm({ ...form, muscle: t })} />
        <TextInput style={styles.input} placeholder="Sets" value={form.sets} onChangeText={(t) => setForm({ ...form, sets: t })} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Reps" value={form.reps} onChangeText={(t) => setForm({ ...form, reps: t })} />
        <TextInput style={styles.input} placeholder="Rest (sec)" value={form.rest} onChangeText={(t) => setForm({ ...form, rest: t })} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Notes" value={form.notes} onChangeText={(t) => setForm({ ...form, notes: t })} />
        <TextInput style={styles.input} placeholder="Order index" value={form.order} onChangeText={(t) => setForm({ ...form, order: t })} keyboardType="numeric" />
        <Button title="Add Exercise" onPress={addExercise} />
      </View>

      <FlatList
        data={exercises}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              {item.sets ?? '-'}x{item.reps ?? '-'} • {item.rest_seconds ?? '-'}s rest
            </Text>
            {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No exercises yet.</Text>}
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
  meta: { color: '#9aa4b2' },
  notes: { color: '#d8dee9' },
  empty: { color: '#9aa4b2', textAlign: 'center', marginTop: 20 },
})
