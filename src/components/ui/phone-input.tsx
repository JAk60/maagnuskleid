// src/components/ui/phone-input.tsx
"use client"

import { useState, useEffect } from "react"

const COUNTRY_CODES = [
  { code: "+91", country: "IN", name: "India" },
  { code: "+1", country: "US", name: "United States" },
  { code: "+1", country: "CA", name: "Canada" },
  { code: "+44", country: "GB", name: "United Kingdom" },
  { code: "+971", country: "AE", name: "UAE" },
  { code: "+61", country: "AU", name: "Australia" },
  { code: "+65", country: "SG", name: "Singapore" },
  { code: "+49", country: "DE", name: "Germany" },
  { code: "+33", country: "FR", name: "France" },
  { code: "+81", country: "JP", name: "Japan" },
  { code: "+86", country: "CN", name: "China" },
  { code: "+7", country: "RU", name: "Russia" },
  { code: "+55", country: "BR", name: "Brazil" },
  { code: "+27", country: "ZA", name: "South Africa" },
  { code: "+52", country: "MX", name: "Mexico" },
  { code: "+39", country: "IT", name: "Italy" },
  { code: "+34", country: "ES", name: "Spain" },
  { code: "+31", country: "NL", name: "Netherlands" },
  { code: "+46", country: "SE", name: "Sweden" },
  { code: "+47", country: "NO", name: "Norway" },
  { code: "+45", country: "DK", name: "Denmark" },
  { code: "+358", country: "FI", name: "Finland" },
  { code: "+41", country: "CH", name: "Switzerland" },
  { code: "+43", country: "AT", name: "Austria" },
  { code: "+32", country: "BE", name: "Belgium" },
  { code: "+351", country: "PT", name: "Portugal" },
  { code: "+30", country: "GR", name: "Greece" },
  { code: "+48", country: "PL", name: "Poland" },
  { code: "+420", country: "CZ", name: "Czech Republic" },
  { code: "+36", country: "HU", name: "Hungary" },
  { code: "+40", country: "RO", name: "Romania" },
  { code: "+380", country: "UA", name: "Ukraine" },
  { code: "+90", country: "TR", name: "Turkey" },
  { code: "+966", country: "SA", name: "Saudi Arabia" },
  { code: "+974", country: "QA", name: "Qatar" },
  { code: "+965", country: "KW", name: "Kuwait" },
  { code: "+973", country: "BH", name: "Bahrain" },
  { code: "+968", country: "OM", name: "Oman" },
  { code: "+92", country: "PK", name: "Pakistan" },
  { code: "+880", country: "BD", name: "Bangladesh" },
  { code: "+94", country: "LK", name: "Sri Lanka" },
  { code: "+977", country: "NP", name: "Nepal" },
  { code: "+60", country: "MY", name: "Malaysia" },
  { code: "+62", country: "ID", name: "Indonesia" },
  { code: "+63", country: "PH", name: "Philippines" },
  { code: "+66", country: "TH", name: "Thailand" },
  { code: "+84", country: "VN", name: "Vietnam" },
  { code: "+82", country: "KR", name: "South Korea" },
  { code: "+64", country: "NZ", name: "New Zealand" },
  { code: "+20", country: "EG", name: "Egypt" },
  { code: "+234", country: "NG", name: "Nigeria" },
  { code: "+254", country: "KE", name: "Kenya" },
  { code: "+233", country: "GH", name: "Ghana" },
  { code: "+256", country: "UG", name: "Uganda" },
  { code: "+255", country: "TZ", name: "Tanzania" },
  { code: "+212", country: "MA", name: "Morocco" },
  { code: "+213", country: "DZ", name: "Algeria" },
  { code: "+216", country: "TN", name: "Tunisia" },
  { code: "+249", country: "SD", name: "Sudan" },
  { code: "+251", country: "ET", name: "Ethiopia" },
  { code: "+502", country: "GT", name: "Guatemala" },
  { code: "+503", country: "SV", name: "El Salvador" },
  { code: "+504", country: "HN", name: "Honduras" },
  { code: "+505", country: "NI", name: "Nicaragua" },
  { code: "+506", country: "CR", name: "Costa Rica" },
  { code: "+507", country: "PA", name: "Panama" },
  { code: "+57", country: "CO", name: "Colombia" },
  { code: "+51", country: "PE", name: "Peru" },
  { code: "+56", country: "CL", name: "Chile" },
  { code: "+54", country: "AR", name: "Argentina" },
  { code: "+58", country: "VE", name: "Venezuela" },
  { code: "+593", country: "EC", name: "Ecuador" },
  { code: "+591", country: "BO", name: "Bolivia" },
  { code: "+595", country: "PY", name: "Paraguay" },
  { code: "+598", country: "UY", name: "Uruguay" },
]

interface PhoneInputProps {
  value: string // stored as plain digits e.g. "9867462121"
  onChange: (value: string) => void // returns plain digits
  className?: string
  placeholder?: string
  required?: boolean
}

/**
 * Parses a stored phone value into { dialCode, number }.
 * Stored format is plain digits: "9867462121"
 * We always store just the local number digits — dial code is display-only.
 */
function parseStoredPhone(stored: string) {
  // Strip everything except digits
  return stored.replace(/\D/g, "")
}

export function PhoneInput({
  value,
  onChange,
  className = "",
  placeholder = "Phone number",
  required,
}: PhoneInputProps) {
  const [dialCode, setDialCode] = useState("+91")
  const [localNumber, setLocalNumber] = useState("")

  // On mount / value change from outside, populate local state
  useEffect(() => {
    const digits = parseStoredPhone(value)
    setLocalNumber(digits)
  }, [value])

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits, max 15 chars (international ITU-T standard)
    const digits = e.target.value.replace(/\D/g, "").slice(0, 15)
    setLocalNumber(digits)
    // Store just the digits — no country code, no spaces
    onChange(digits)
  }

  const handleDialCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDialCode(e.target.value)
    // Re-emit current number (dial code is display-only, not stored)
    onChange(localNumber)
  }

  return (
    <div className={`flex gap-0 ${className}`}>
      <select
        value={dialCode}
        onChange={handleDialCodeChange}
        className="px-2 py-2 border border-border rounded-l-lg border-r-0 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-sm min-w-22.5"
      >
        {COUNTRY_CODES.map((c, i) => (
          <option key={`${c.country}-${i}`} value={c.code}>
            {c.country} {c.code}
          </option>
        ))}
      </select>
      <input
        type="tel"
        inputMode="numeric"
        placeholder={placeholder}
        value={localNumber}
        onChange={handleNumberChange}
        required={required}
        className="flex-1 px-4 py-2 border border-border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
      />
    </div>
  )
}