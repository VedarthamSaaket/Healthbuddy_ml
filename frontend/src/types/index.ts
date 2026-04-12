
export type Theme = 'dark' | 'light'
export type Language = 'en' | 'hi' | 'te' | 'kn'
export type UserRole = 'user' | 'doctor'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  theme: Theme
  language: Language
  age_confirmed: boolean
  created_at: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  predictions?: Prediction[]
  symptoms?: string[]
  emergency?: boolean
}

export interface Prediction {
  disease: string
  confidence: number
}

export interface Doctor {
  id: string
  user_id: string
  name: string
  specialty: string
  bio?: string
  available: boolean
}

export interface Appointment {
  id: string
  user_id: string
  doctor_id: string
  status: 'pending' | 'confirmed' | 'cancelled'
  note?: string
  requested_at: string
}

export interface SymptomHistory {
  id: string
  symptoms: string[]
  predictions: Prediction[]
  created_at: string
}
