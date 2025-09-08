import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { supabase } from './src/lib/supabase'
import AdminTabs from './src/nav/AdminTabs'

export default function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isAuthed, setIsAuthed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // check existing session on app load
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthed(!!data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsAuthed(!!session)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signIn = async () => {
    setMessage('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message)
    else setMessage(`Signed in as ${data.user?.email}`)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading…</Text>
      </View>
    )
  }

  if (!isAuthed) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Gym Admin Login</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Button title="Sign In" onPress={signIn} />
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    )
  }

  return (
    <NavigationContainer>
      <AdminTabs />
      <View style={{ position: 'absolute', right: 12, top: 50 }}>
        <Button title="Sign out" onPress={signOut} />
      </View>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#0b0f1a' },
  title: { fontSize: 22, fontWeight: 'bold', color: 'white', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: 'white', marginBottom: 12, padding: 10, borderRadius: 6 },
  message: { marginTop: 20, color: 'white', textAlign: 'center' },
})
