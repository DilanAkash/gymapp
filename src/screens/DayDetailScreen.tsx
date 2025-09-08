import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, Button, TextInput, StyleSheet, Alert } from 'react-native'
import { supabase } from '../lib/supabase'
import { NativeStackScreenProps } from '@react-navigation/native-stack'

type Exercise = {
  id: string
  name: string
  muscle_group: string | null
  sets: number | null
  reps: string | null
  rest_seconds: number | null
  notes: string | null
}

type RootStackParamList = {
  TemplateList: undefined
  TemplateDetail: { templateId: string; name: string }
  DayDetail: { dayId: string; name: string }
}

type Props = NativeStackScreenProps<RootStackParamList, 'DayDetail'>

export default function DayDetailScreen({ route }: Props) {
  const { dayId, name } = route.params
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [exerciseName, setExerciseName] = useState('')
  const [muscle, setMuscle] = useState('')
  const [sets, setSets] = useState('')
  const [reps, setReps] = useState('')
  const [rest, setRest] = useState('')
  const [notes, setNotes] = useState('')

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

  const createExercise = async () => {
    if (!exerciseName.trim()) {
      Alert.alert('Validation', 'Exercise name is required')
      return
    }
    const { error } = await supabase.from('workout_exercises').insert({
      day_id: dayId,
      name: exerciseName.trim(),
      muscle_group: muscle.trim() || null,
      sets: sets ? parseInt(sets) : null,
      reps: reps.trim() || null,
      rest_seconds: rest ? parseInt(rest) : null,
      notes: notes.trim() || null,
      order_index: exercises.length,
    })
    if (error) {
      Alert.alert('Error', error.message)
      return
    }
    setExerciseName('')
    setMuscle('')
    setSets('')
    setReps('')
    setRest('')
    setNotes('')
    loadExercises()
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Day: {name}</Text>

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Exercise Name"
          value={exerciseName}
          onChangeText={setExerciseName}
        />
        <TextInput
          style={styles.input}
          placeholder="Muscle Group"
          value={muscle}
          onChangeText={setMuscle}
        />
        <TextInput
          style={styles.input}
          placeholder="Sets"
          value={sets}
          onChangeText={setSets}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Reps"
          value={reps}
          onChangeText={setReps}
        />
        <TextInput
          style={styles.input}
          placeholder="Rest seconds"
          value={rest}
          onChangeText={setRest}
          keyboardType="numeric"
        />
        <TextInput
          style={[styles.input, { height: 60 }]}
          placeholder="Notes"
          value={notes}
          onChangeText={setNotes}
          multiline
        />
        <Button title="Add Exercise" onPress={createExercise} />
      </View>

      <FlatList
        data={exercises}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              {item.sets} x {item.reps} | {item.rest_seconds}s rest
            </Text>
            {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f1a', padding: 16 },
  header: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  card: { backgroundColor: '#111828', padding: 12, borderRadius: 12, marginBottom: 12 },
  input: { backgroundColor: 'white', borderRadius: 8, padding: 10, marginBottom: 8 },
  row: { paddingVertical: 10, borderBottomColor: '#22293a', borderBottomWidth: 1 },
  name: { color: 'white', fontWeight: '700' },
  meta: { color: '#d8dee9', fontSize: 12 },
  notes: { color: '#9aa4b2', fontSize: 12 },
})
