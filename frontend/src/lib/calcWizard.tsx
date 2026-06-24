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

// Max monthly contribution at which a user can save a 10% deposit (+ 3yr appreciation) in 3 years
export function maxMonthlyFor3yDeposit(price: number, savings: number): number {
  const deposit3y = Math.round(price * 0.10 * Math.pow(1.05, 3))
  return Math.max(100, Math.ceil(Math.max(0, deposit3y - savings) / 36 / 5) * 5)
}

// GHI that matches default property (minimum income to pass income check)
const DEFAULT_GHI = Math.round(DEFAULT_PRICE * 0.9 / 4 / 1000) * 1000  // 79000
const DEFAULT_SAVINGS = Math.round(DEFAULT_PRICE * 0.01)  // 3500

const DEFAULT: CalcWizardState = {
  propertyPrice: DEFAULT_PRICE,
  age: 30,
  currentSavings: DEFAULT_SAVINGS,
  monthlySavings: 500,
  ...computeFromPrice(DEFAULT_PRICE),
  county: '',
  dublinPostcode: null,
  householdType: null,
  isFtb: null,
  employmentType: null,
  ghi: DEFAULT_GHI,
  eligible: false,
  variant: null,
}

interface CalcWizardContextValue {
  state: CalcWizardState
  update: (updates: Partial<CalcWizardState>) => void
  reset: () => void
  setPrice: (price: number) => void
  setGhi: (ghi: number) => void
}

const CalcWizardContext = createContext<CalcWizardContextValue>({
  state: DEFAULT,
  update: () => {},
  reset: () => {},
  setPrice: () => {},
  setGhi: () => {},
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
    setState(prev => {
      // Track the 1% Entry Stake as price moves; keep custom savings otherwise
      const prevEntryStake = Math.round(prev.propertyPrice * 0.01)
      const newSavings = prev.currentSavings === prevEntryStake
        ? Math.round(price * 0.01)
        : Math.min(prev.currentSavings, Math.round(price * 0.10))
      const maxMonthly = maxMonthlyFor3yDeposit(price, newSavings)
      return {
        ...prev,
        propertyPrice: price,
        ...computeFromPrice(price),
        currentSavings: newSavings,
        monthlySavings: Math.min(prev.monthlySavings, maxMonthly),
      }
    })
  }

  // When GHI changes, drive property to the max affordable target
  function setGhi(newGhi: number) {
    const newPrice = Math.max(200000, Math.min(800000,
      Math.floor(newGhi * 4 / 0.9 / 5000) * 5000
    ))
    setState(prev => {
      const prevEntryStake = Math.round(prev.propertyPrice * 0.01)
      const newSavings = prev.currentSavings === prevEntryStake
        ? Math.round(newPrice * 0.01)
        : Math.min(prev.currentSavings, Math.round(newPrice * 0.10))
      const maxMonthly = maxMonthlyFor3yDeposit(newPrice, newSavings)
      return {
        ...prev,
        ghi: newGhi,
        propertyPrice: newPrice,
        ...computeFromPrice(newPrice),
        currentSavings: newSavings,
        monthlySavings: Math.min(prev.monthlySavings, maxMonthly),
      }
    })
  }

  return (
    <CalcWizardContext.Provider value={{ state, update, reset, setPrice, setGhi }}>
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
