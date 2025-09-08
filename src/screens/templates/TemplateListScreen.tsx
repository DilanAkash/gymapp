// src/screens/templates/TemplateListScreen.tsx
import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, TextInput, Button, Alert, TouchableOpacity, StyleSheet } from 'react-native'
import { supabase } from '../../lib/supabase'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { TemplateStackParamList } from '../../nav/AdminTabs'

type Template = {
  id: string
  name: string
  goal: string | null
  level: string | null
  created_at: string
}

type Props = NativeStackScreenProps<TemplateStackParamList, 'TemplateList'>

export default function TemplateListScreen({ navigation }: Props) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [level, setLevel] = useState('')

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('workout_templates')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) Alert.alert('Error', error.message)
    else setTemplates((data ?? []) as Template[])
  }

  useEffect(() => {
    const unsub = navigation.addListener('focus', loadTemplates)
    return unsub
  }, [navigation])

  const createTemplate = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Name is required')
      return
    }
    const { error } = await supabase.from('workout_templates').insert({
      name: name.trim(),
      goal: goal.trim() || null,
      level: level.trim() || null,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    })
    if (error) {
      Alert.alert('Error', error.message)
      return
    }
    setName(''); setGoal(''); setLevel('')
    loadTemplates()
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Workout Templates</Text>

      <View style={styles.card}>
        <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Goal" value={goal} onChangeText={setGoal} />
        <TextInput style={styles.input} placeholder="Level" value={level} onChangeText={setLevel} />
        <Button title="Create Template" onPress={createTemplate} />
      </View>

      <FlatList
        data={templates}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('TemplateDetail', { templateId: item.id, name: item.name })}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>{item.goal ?? ''} {item.level ?? ''}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No templates yet.</Text>}
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
  empty: { color: '#9aa4b2', textAlign: 'center', marginTop: 20 },
})
