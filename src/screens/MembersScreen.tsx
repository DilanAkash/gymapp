// src/screens/MembersScreen.tsx
import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { supabase } from '../lib/supabase'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { MembersStackParamList } from '../nav/AdminTabs'

type Member = {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  status: 'active' | 'inactive'
  created_at: string
}

type Props = NativeStackScreenProps<MembersStackParamList, 'MembersHome'>

export default function MembersScreen({ navigation }: Props) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  const loadMembers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) Alert.alert('Error', error.message)
    else setMembers((data ?? []) as Member[])
    setLoading(false)
  }

  useEffect(() => {
    const unsub = navigation.addListener('focus', loadMembers)
    return unsub
  }, [navigation])

  const createMember = async () => {
    if (!name.trim()) return Alert.alert('Validation', 'Full name is required')
    const { error } = await supabase.from('members').insert({
      full_name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      status: 'active',
      created_by: (await supabase.auth.getUser()).data.user?.id,
    })
    if (error) return Alert.alert('Error', error.message)
    setName(''); setPhone(''); setEmail('')
    loadMembers()
  }

  const toggleStatus = async (m: Member) => {
    const next = m.status === 'active' ? 'inactive' : 'active'
    const { error } = await supabase.from('members').update({ status: next }).eq('id', m.id)
    if (error) return Alert.alert('Error', error.message)
    loadMembers()
  }

  const deleteMember = async (id: string) => {
    const { error } = await supabase.from('members').delete().eq('id', id)
    if (error) return Alert.alert('Error', error.message)
    loadMembers()
  }

  const MemberRow = ({ item }: { item: Member }) => (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.full_name}</Text>
        <Text style={styles.meta}>
          {item.phone ?? ''} {item.email ?? ''}
        </Text>
        <Text style={[styles.status, { color: item.status === 'active' ? 'lime' : 'tomato' }]}>
          {item.status.toUpperCase()}
        </Text>
      </View>
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity style={styles.btn} onPress={() => toggleStatus(item)}>
          <Text style={styles.btnText}>{item.status === 'active' ? 'Deactivate' : 'Activate'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: '#2563eb' }]}
          onPress={() => navigation.navigate('AssignPlan', { memberId: item.id, memberName: item.full_name })}
        >
          <Text style={styles.btnText}>Assign</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#b91c1c' }]} onPress={() => deleteMember(item.id)}>
          <Text style={styles.btnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Members</Text>

      <View style={styles.card}>
        <Text style={styles.cardHeader}>Add Member</Text>
        <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} />
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />
        <Button title="Add Member" onPress={createMember} />
      </View>

      <Button title={loading ? 'Refreshing…' : 'Refresh'} onPress={loadMembers} />

      <FlatList
        data={members}
        keyExtractor={(m) => m.id}
        renderItem={MemberRow}
        ListEmptyComponent={
          <Text style={{ color: '#9aa4b2', textAlign: 'center', marginTop: 16 }}>
            No members yet.
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
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomColor: '#22293a', borderBottomWidth: 1 },
  name: { color: 'white', fontWeight: '700' },
  meta: { color: '#d8dee9', fontSize: 12 },
  status: { fontWeight: '700', marginTop: 4 },
  btn: { backgroundColor: '#374151', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, marginLeft: 6 },
  btnText: { color: 'white', fontWeight: '600' },
})
