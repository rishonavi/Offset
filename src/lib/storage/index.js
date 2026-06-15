import { hasSupabase } from '../supabaseClient'
import * as local from './local'
import * as remote from './supabase'

// `db` exposes one stable interface regardless of backend:
//   auth:      getCurrentUser, onAuthStateChange, signIn, signUp, signOut
//   data:      getProperties / addProperty / updateProperty / deleteProperty
//              getExpenses   / addExpense   / updateExpense   / deleteExpense
//   receipts:  uploadReceipt(file) -> stored string, getReceiptUrl(stored) -> url
export const isCloud = hasSupabase
export const db = hasSupabase ? remote : local
