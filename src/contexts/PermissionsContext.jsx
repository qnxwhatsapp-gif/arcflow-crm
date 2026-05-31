import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { hasPermission as checkPermission } from '../lib/permissions'

const PermissionsContext = createContext(null)

export function PermissionsProvider({ children }) {
  const { profile } = useAuth()
  const [permissions, setPermissions] = useState({})

  useEffect(() => {
    supabase.from('permissions').select('*').then(({ data }) => {
      if (!data) return
      const map = {}
      data.forEach(row => {
        const camelRow = {}
        Object.keys(row).forEach(k => {
          const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
          camelRow[camel] = row[k]
        })
        map[row.role] = camelRow
      })
      setPermissions(map)
    })
  }, [])

  async function updatePermission(role, key, value) {
    // key is already snake_case when called from Team.jsx ACL matrix
    await supabase.from('permissions').update({ [key]: value }).eq('role', role)
    // Also update local camelCase state
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    setPermissions(prev => ({
      ...prev,
      [role]: { ...prev[role], [camelKey]: value }
    }))
  }

  function hasPermission(key) {
    return checkPermission(profile, permissions, key)
  }

  return (
    <PermissionsContext.Provider value={{ permissions, hasPermission, updatePermission }}>
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissions() {
  return useContext(PermissionsContext)
}
