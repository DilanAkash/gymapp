// src/screens/InventoryScreen.tsx
import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { supabase } from '../lib/supabase'

type Product = {
  product_id: string
  sku: string | null
  name: string
  category: string | null
  price: number
  currency: string
  tax_pct: number
  track_stock: boolean
  is_active: boolean
  stock_qty: number
}

export default function InventoryScreen() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  // add product form
  const [sku, setSku] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('14500')
  const [taxPct, setTaxPct] = useState('0')

  // stock action form
  const [qty, setQty] = useState('1')
  const [note, setNote] = useState('')

  // sale form (single item quick sale)
  const [saleQty, setSaleQty] = useState('1')
  const [salePrice, setSalePrice] = useState('0') // default: use product price if 0

  const loadProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('v_product_stock')
      .select('*')
      .order('name', { ascending: true })
    if (error) Alert.alert('Error', error.message)
    else setProducts((data ?? []) as Product[])
    setLoading(false)
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const addProduct = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Product name is required')
      return
    }
    const p = parseFloat(price || '0')
    const t = parseFloat(taxPct || '0')
    const { error } = await supabase.from('products').insert({
      sku: sku.trim() || null,
      name: name.trim(),
      category: category.trim() || null,
      price: isNaN(p) ? 0 : p,
      tax_pct: isNaN(t) ? 0 : t,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    })
    if (error) {
      Alert.alert('Error', error.message)
      return
    }
    setSku(''); setName(''); setCategory(''); setPrice('14500'); setTaxPct('0')
    Alert.alert('Success', 'Product added')
    loadProducts()
  }

  const addStock = async (productId: string, type: 'purchase' | 'adjustment') => {
    const q = parseInt(qty, 10)
    if (isNaN(q) || q === 0) {
      Alert.alert('Validation', 'Quantity must be a non-zero integer')
      return
    }
    const { error } = await supabase.rpc('add_stock_movement', {
      p_product_id: productId,
      p_type: type,
      p_qty: q,
      p_note: note || null,
    })
    if (error) {
      Alert.alert('Error', error.message)
      return
    }
    setQty('1'); setNote('')
    Alert.alert('Success', type === 'purchase' ? 'Stock purchased' : 'Stock adjusted')
    loadProducts()
  }

  const quickSale = async (p: Product) => {
    const q = parseInt(saleQty, 10)
    if (isNaN(q) || q <= 0) {
      Alert.alert('Validation', 'Sale quantity must be a positive integer')
      return
    }
    // default unit price = product price if field is 0 or blank
    const explicit = parseFloat(salePrice || '0')
    const unit_price = explicit > 0 ? explicit : p.price

    const items = [
      { product_id: p.product_id, qty: q, unit_price }
    ]
    const { data, error } = await supabase.rpc('create_sale_with_items', {
      p_member_id: null,      // optional link to a member later
      p_method: 'cash',
      p_items: items,
    } as any) // Supabase TS types for RPC JSON can be strict; 'as any' keeps it simple here.

    if (error) {
      Alert.alert('Error', error.message)
      return
    }
    setSaleQty('1'); setSalePrice('0')
    Alert.alert('Success', `Sale created: ${data}`)
    loadProducts()
  }

  const ProductRow = ({ item }: { item: Product }) => (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>
          {item.sku ? `${item.sku} • ` : ''}{item.category ?? '—'}
        </Text>
        <Text style={styles.meta}>
          Price: {item.price} {item.currency} • Stock: {item.stock_qty}
        </Text>
      </View>

      {/* Stock actions */}
      <View style={styles.actionsCol}>
        <Text style={styles.section}>Stock</Text>
        <TextInput
          style={styles.smallInput}
          placeholder="Qty"
          value={qty}
          onChangeText={setQty}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.smallInput}
          placeholder="Note (opt)"
          value={note}
          onChangeText={setNote}
        />
        <View style={styles.rowButtons}>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#2563eb' }]} onPress={() => addStock(item.product_id, 'purchase')}>
            <Text style={styles.btnText}>Purchase +</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#6b7280' }]} onPress={() => addStock(item.product_id, 'adjustment')}>
            <Text style={styles.btnText}>Adjust ±</Text>
          </TouchableOpacity>
        </View>

        {/* Quick sale */}
        <Text style={[styles.section, { marginTop: 8 }]}>Quick Sale</Text>
        <TextInput
          style={styles.smallInput}
          placeholder="Qty"
          value={saleQty}
          onChangeText={setSaleQty}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.smallInput}
          placeholder={`Unit price (0 = ${item.price})`}
          value={salePrice}
          onChangeText={setSalePrice}
          keyboardType="numeric"
        />
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#16a34a' }]} onPress={() => quickSale(item)}>
          <Text style={styles.btnText}>Sell</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Inventory</Text>

      {/* Add product */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>Add Product</Text>
        <TextInput style={styles.input} placeholder="SKU (optional)" value={sku} onChangeText={setSku} />
        <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Category (optional)" value={category} onChangeText={setCategory} />
        <TextInput style={styles.input} placeholder="Price (e.g., 14500)" value={price} onChangeText={setPrice} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Tax % (e.g., 0 or 15)" value={taxPct} onChangeText={setTaxPct} keyboardType="numeric" />
        <Button title="Add Product" onPress={addProduct} />
      </View>

      <View style={styles.rowBetween}>
        <Button title={loading ? 'Refreshing…' : 'Refresh'} onPress={loadProducts} />
        <Text style={{ color: '#9aa4b2' }}>{products.length} items</Text>
      </View>

      <FlatList
        data={products}
        keyExtractor={(p) => p.product_id}
        renderItem={ProductRow}
        ListEmptyComponent={
          <Text style={{ color: '#9aa4b2', textAlign: 'center', marginTop: 16 }}>
            No products yet.
          </Text>
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f1a', padding: 16 },
  header: { color: 'white', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },

  card: { backgroundColor: '#111828', borderRadius: 12, padding: 12, marginBottom: 12 },
  cardHeader: { color: 'white', fontWeight: '700', marginBottom: 8 },

  input: { backgroundColor: 'white', borderRadius: 8, padding: 10, marginBottom: 8 },

  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, borderBottomColor: '#22293a', borderBottomWidth: 1 },
  name: { color: 'white', fontWeight: '700' },
  meta: { color: '#9aa4b2' },

  actionsCol: { width: 180, marginLeft: 12 },
  section: { color: 'white', fontWeight: '700', marginBottom: 6 },
  smallInput: { backgroundColor: 'white', borderRadius: 8, padding: 8, marginBottom: 6 },

  rowButtons: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  btn: { paddingHorizontal: 10, paddingVertical: 10, borderRadius: 8 },
  btnText: { color: 'white', fontWeight: '700', textAlign: 'center' },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
})
