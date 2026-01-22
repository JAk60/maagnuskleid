// app/admin/test/page.tsx
"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export default function AdminTestPage() {
  const [email, setEmail] = useState("admin@maagnuskleid.com")
  const [password, setPassword] = useState("Admin@123")
  const [testResults, setTestResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, message])
    console.log(message)
  }

  const testAdminPassword = async () => {
    setTestResults([])
    setLoading(true)

    try {
      addResult("🔍 Starting admin password test...")
      addResult(`📧 Email: ${email}`)
      addResult(`🔑 Password: ${password}`)
      addResult("---")

      // Step 1: Check if admin exists
      addResult("Step 1: Checking if admin exists...")
      const { data: admin, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single()

      if (adminError || !admin) {
        addResult(`❌ Admin not found: ${adminError?.message}`)
        setLoading(false)
        return
      }

      addResult(`✅ Admin found: ${admin.name} (${admin.role})`)
      addResult(`📊 Admin ID: ${admin.id}`)
      addResult("---")

      // Step 2: Check password hash
      addResult("Step 2: Checking password hash...")
      addResult(`🔐 Hash from DB: ${admin.password_hash}`)
      addResult(`📏 Hash length: ${admin.password_hash?.length}`)
      addResult(`🔤 Hash starts with: ${admin.password_hash?.substring(0, 7)}`)
      addResult("---")

      // Step 3: Verify password with bcrypt
      addResult("Step 3: Verifying password with bcrypt...")
      try {
        const isValid = await bcrypt.compare(password, admin.password_hash)
        if (isValid) {
          addResult(`✅ PASSWORD MATCHES! Login should work.`)
        } else {
          addResult(`❌ PASSWORD DOES NOT MATCH!`)
          addResult(`⚠️ The hash in your database doesn't match the password.`)
        }
      } catch (bcryptError: any) {
        addResult(`❌ Bcrypt error: ${bcryptError.message}`)
      }
      addResult("---")

      // Step 4: Generate new hash for comparison
      addResult("Step 4: Generating new hash for comparison...")
      const newHash = await bcrypt.hash(password, 10)
      addResult(`🔐 New hash: ${newHash}`)
      
      const newHashMatches = await bcrypt.compare(password, newHash)
      addResult(`✅ New hash verification: ${newHashMatches ? 'PASS' : 'FAIL'}`)
      addResult("---")

      // Step 5: Check if hashes are bcrypt format
      addResult("Step 5: Validating hash format...")
      const isBcryptFormat = admin.password_hash?.startsWith('$2a$') || 
                           admin.password_hash?.startsWith('$2b$') ||
                           admin.password_hash?.startsWith('$2y$')
      
      if (isBcryptFormat) {
        addResult(`✅ Hash format is valid bcrypt`)
      } else {
        addResult(`❌ Hash format is NOT bcrypt!`)
        addResult(`⚠️ Expected format: $2a$10$... or $2b$10$...`)
        addResult(`⚠️ Your hash starts with: ${admin.password_hash?.substring(0, 10)}`)
      }

    } catch (error: any) {
      addResult(`💥 Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const generateNewHash = async () => {
    setTestResults([])
    setLoading(true)

    try {
      addResult("🔨 Generating new password hash...")
      addResult(`🔑 Password: ${password}`)
      addResult("---")

      const newHash = await bcrypt.hash(password, 10)
      addResult(`✅ New hash generated: ${newHash}`)
      addResult("---")
      
      addResult("📝 To update your database, run this SQL:")
      addResult(`UPDATE admin_users SET password_hash = '${newHash}' WHERE email = '${email}';`)
      addResult("---")

      const verification = await bcrypt.compare(password, newHash)
      addResult(`✅ Verification test: ${verification ? 'PASS' : 'FAIL'}`)

    } catch (error: any) {
      addResult(`💥 Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const updateHashInDB = async () => {
    if (!confirm('Are you sure you want to update the password hash in the database?')) {
      return
    }

    setTestResults([])
    setLoading(true)

    try {
      addResult("🔄 Updating password hash in database...")
      
      const newHash = await bcrypt.hash(password, 10)
      addResult(`🔐 New hash: ${newHash}`)

      const { error } = await supabase
        .from('admin_users')
        .update({ password_hash: newHash })
        .eq('email', email)

      if (error) {
        addResult(`❌ Update failed: ${error.message}`)
      } else {
        addResult(`✅ Password hash updated successfully!`)
        addResult(`🎉 You can now login with email: ${email}`)
        addResult(`🎉 And password: ${password}`)
      }

    } catch (error: any) {
      addResult(`💥 Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-6">🔧 Admin Password Test Tool</h1>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={testAdminPassword}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? "Testing..." : "🧪 Test Password"}
            </button>

            <button
              onClick={generateNewHash}
              disabled={loading}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              🔨 Generate New Hash
            </button>

            <button
              onClick={updateHashInDB}
              disabled={loading}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              🔄 Update Hash in DB
            </button>
          </div>

          {/* Results */}
          {testResults.length > 0 && (
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">📊 Test Results:</h2>
              <div className="space-y-1 font-mono text-sm">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`
                      ${result.includes('✅') ? 'text-green-400' : ''}
                      ${result.includes('❌') ? 'text-red-400' : ''}
                      ${result.includes('⚠️') ? 'text-yellow-400' : ''}
                      ${result.includes('🔍') || result.includes('Step') ? 'text-blue-400 font-bold' : ''}
                      ${result === '---' ? 'text-gray-600' : ''}
                      ${!result.includes('✅') && !result.includes('❌') && !result.includes('⚠️') && !result.includes('🔍') && !result.includes('Step') && result !== '---' ? 'text-gray-300' : ''}
                    `}
                  >
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <h3 className="text-blue-400 font-semibold mb-2">📝 Instructions:</h3>
            <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
              <li>Click "🧪 Test Password" to check if your current hash works</li>
              <li>If it fails, click "🔄 Update Hash in DB" to fix it</li>
              <li>After updating, try logging in again</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}