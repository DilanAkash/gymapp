// src/screens/members/AssignPlanScreen.tsx
import React, { useEffect, useState } from 'react'
import { View, Text, Alert, Button, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native'
import { supabase } from '../../lib/supabase'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { MembersStackParamList } from '../../nav/AdminTabs'

type Template = { id: string; name: string }

type Assignment = {
  id: string
  template_id: string
  start_date: string
  end_date: string | null
  notes: string | null
  created_at: string
  template_name?: string
}

type Props = NativeStackScreenProps<MembersStackParamList, 'AssignPlan'>

export default function AssignPlanScreen({ route, navigation }: Props) {
  const { memberId, memberName } = route.params
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10)) // YYYY-MM-DD
  const [notes, setNotes] = useState<string>('')
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(false)

  const loadTemplates = async () => {
    const { data, error } = await supabase.from('workout_templates').select('id, name').order('created_at', { ascending: false })
    if (error) Alert.alert('Error', error.message)
    else setTemplates((data ?? []) as Template[])
  }

  const loadAssignments = async () => {
    // join to show template name
    const { data, error } = await supabase
      .from('assigned_plans')
      .select('id, template_id, start_date, end_date, notes, created_at, workout_templates(name)')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })

    if (error) {
      Alert.alert('Error', error.message)
      return
    }

    const withName = (data ?? []).map((row: any) => ({
      ...row,
      template_name: row.workout_templates?.name ?? '',
    }))
    setAssignments(withName as Assignment[])
  }

  useEffect(() => {
    loadTemplates()
    loadAssignments()
  }, [])

  const assign = async () => {
    if (!selectedTemplate) {
      Alert.alert('Validation', 'Please select a template')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('assigned_plans').insert({
      member_id: memberId,
      template_id: selectedTemplate,
      start_date: startDate,
      notes: notes || null,
      assigned_by: (await supabase.auth.getUser()).data.user?.id,
    })
    setLoading(false)
    if (error) {
      Alert.alert('Error', error.message)
      return
    }
    setNotes('')
    Alert.alert('Success', 'Plan assigned')
    loadAssignments()
  }

  const unassign = async (id: string) => {
    const { error } = await supabase.from('assigned_plans').delete().eq('id', id)
    if (error) {
      Alert.alert('Error', error.message)
      return
    }
    loadAssignments()
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Assign to {memberName}</Text>

      {/* picker substitute: simple list select */}
      <Text style={styles.sectionTitle}>1) Choose a template</Text>
      <FlatList
        data={templates}
        keyExtractor={(t) => t.id}
        horizontal
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.templateChip,
              selectedTemplate === item.id && styles.templateChipActive,
            ]}
            onPress={() => setSelectedTemplate(item.id)}
          >
            <Text style={styles.chipText}>{item.name}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ color: '#9aa4b2' }}>No templates yet</Text>}
        contentContainerStyle={{ paddingBottom: 8 }}
      />

      <Text style={styles.sectionTitle}>2) Start date (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={startDate}
        onChangeText={setStartDate}
        placeholder="YYYY-MM-DD"
      />

      <Text style={styles.sectionTitle}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Any notes…"
        multiline
      />

      <Button title={loading ? 'Assigning…' : 'Assign Plan'} onPress={assign} />

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Current assignments</Text>
      <FlatList
        data={assignments}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => (
          <View style={styles.assignmentRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.assignmentName}>{item.template_name ?? item.template_id}</Text>
              <Text style={styles.assignmentMeta}>{item.start_date}{item.end_date ? ` → ${item.end_date}` : ''}</Text>
              {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
            </View>
            <TouchableOpacity style={styles.unassignBtn} onPress={() => unassign(item.id)}>
              <Text style={{ color: 'white', fontWeight: '700' }}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#9aa4b2', textAlign: 'center' }}>No assignments yet.</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f1a', padding: 16 },
  header: { color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  sectionTitle: { color: 'white', fontWeight: '700', marginTop: 8, marginBottom: 6 },
  templateChip: { backgroundColor: '#111828', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, marginRight: 8 },
  templateChipActive: { backgroundColor: '#374151' },
  chipText: { color: 'white' },
  input: { backgroundColor: 'white', borderRadius: 8, padding: 10, marginBottom: 10 },
  assignmentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomColor: '#22293a', borderBottomWidth: 1 },
  assignmentName: { color: 'white', fontWeight: '700' },
  assignmentMeta: { color: '#9aa4b2' },
  notes: { color: '#d8dee9' },
  unassignBtn: { backgroundColor: '#b91c1c', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, marginLeft: 10 },
})
