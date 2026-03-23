export type { Database, Tables, InsertTables, UpdateTables, Json } from './database'

export interface Address {
  street: string
  suburb: string
  state: string
  postcode: string
}

export interface EmergencyContact {
  name: string
  relationship: string
  phone: string
  is_guardian: boolean
}

export interface Medication {
  name: string
  dosage: string
  frequency: string
}

export interface Goal {
  goal: string
  priority: 'high' | 'medium' | 'low'
  notes: string
}

export interface ServiceItem {
  registration_group: string
  description: string
  frequency: string
  rate: number
}

export interface GeoLocation {
  lat: number
  lng: number
  accuracy: number
}
