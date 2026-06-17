import { createContext, useContext, useState } from 'react'
import { Outlet } from 'react-router-dom'

export type CalcVariant = 'eligible' | 'mover' | null

export interface CalcWizardState {
  // Step 1 — sliders
  propertyPrice: number
  age: number
  currentSavings: number
  monthlySavings: number
  // Computed from propertyPrice
  entryStake: number
  monthlyDomiter: number
  strikePrice: number
  // Step 4 — details
  county: string
  dublinPostcode: string | null
  householdType: 'solo' | 'couple' | null
  isFtb: boolean | null
  employmentType: 'paye' | 'self_employed' | 'mixed' | null
  ghi: number
  // Derived
  eligible: boolean
  variant: CalcVariant
}

const DEFAULT_PRICE = 350000

function computeFromPrice(price: number) {
  return {
    entryStake: Math.round(price * 0.01),
    monthlyDomiter: parseFloat(((price * 0.082) / 12).toFixed(2)),
    strikePrice: Math.round(price * 0.9),
  }
}

const DEFAULT: CalcWizardState = {
  propertyPrice: DEFAULT_PRICE,
  age: 30,
  currentSavings: 0,
  monthlySavings: 500,
  ...computeFromPrice(DEFAULT_PRICE),
  county: '',
  dublinPostcode: null,
  householdType: null,
  isFtb: null,
  employmentType: null,
  ghi: 60000,
  eligible: false,
  variant: null,
}

interface CalcWizardContextValue {
  state: CalcWizardState
  update: (updates: Partial<CalcWizardState>) => void
  reset: () => void
  setPrice: (price: number) => void
}

const CalcWizardContext = createContext<CalcWizardContextValue>({
  state: DEFAULT,
  update: () => {},
  reset: () => {},
  setPrice: () => {},
})

export function CalcWizardProvider() {
  const [state, setState] = useState<CalcWizardState>(DEFAULT)

  function update(updates: Partial<CalcWizardState>) {
    setState(prev => ({ ...prev, ...updates }))
  }

  function reset() {
    setState(DEFAULT)
  }

  function setPrice(price: number) {
    setState(prev => ({
      ...prev,
      propertyPrice: price,
      ...computeFromPrice(price),
      currentSavings: Math.min(prev.currentSavings, Math.round(price * 0.10)),
    }))
  }

  return (
    <CalcWizardContext.Provider value={{ state, update, reset, setPrice }}>
      <Outlet />
    </CalcWizardContext.Provider>
  )
}

export function useCalcWizard() {
  return useContext(CalcWizardContext)
}

export { computeFromPrice }

export const ROI_COUNTIES = [
  'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway',
  'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick',
  'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly',
  'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath',
  'Wexford', 'Wicklow',
]

export const DUBLIN_POSTCODES = [
  'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D6W', 'D7', 'D8', 'D9',
  'D10', 'D11', 'D12', 'D13', 'D14', 'D15', 'D16', 'D17', 'D18',
  'D20', 'D22', 'D24',
]
