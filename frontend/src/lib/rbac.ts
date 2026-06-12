import type { StaffRole } from '@/types'

export function canAdvancePhase1(role: StaffRole | undefined): boolean {
  return role === 'admin' || role === 'onboarding'
}

export function canAdvancePhase2(role: StaffRole | undefined): boolean {
  return role === 'admin' || role === 'purchasing_agent'
}

export function canAdvancePhase3(role: StaffRole | undefined): boolean {
  return role === 'admin' || role === 'client_success'
}

export function canAssignDAC(role: StaffRole | undefined): boolean {
  return role === 'admin' || role === 'finance'
}

export function canManageTeam(role: StaffRole | undefined): boolean {
  return role === 'admin'
}

export function canViewProspects(role: StaffRole | undefined): boolean {
  return role === 'admin' || role === 'onboarding' || role === 'finance'
}

export function canViewClients(role: StaffRole | undefined): boolean {
  return role === 'admin' || role === 'purchasing_agent' || role === 'client_success'
}

export function canViewCircle(role: StaffRole | undefined): boolean {
  return role === 'admin' || role === 'circle_relations'
}

export function canViewDACs(role: StaffRole | undefined): boolean {
  return role === 'admin' || role === 'finance' || role === 'purchasing_agent'
}
