import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://bamnugjncvijvfpruyhk.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhbW51Z2puY3ZpanZmcHJ1eWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjkxNjQsImV4cCI6MjA5NDEwNTE2NH0.Ndy8BFnRc2TUWsCfc5J_sG94803xN-g2rxUoxto--40'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export type Profile = {
  id: string
  full_name: string
  email: string
  career: string
  semester: number
  role?: 'driver' | 'user'
  phone?: string
  avatar_initials: string
  rating: number
  trips_count: number
}

export type Ride = {
  id: string
  driver_id: string
  origin: string
  destination: string
  departure_time: string
  seats_total: number
  seats_available: number
  price: number
  vehicle: string
  notes?: string
  status: 'active' | 'completed' | 'cancelled'
  profiles?: Profile
}

export type RideRequest = {
  id: string
  ride_id: string
  passenger_id: string
  status: 'pending' | 'accepted' | 'rejected'
  rides?: Ride
}
