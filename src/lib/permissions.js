export function hasPermission(user, permissions, key) {
  if (!user) return false
  if (user.role === 'principal') return true
  if (!permissions || !permissions[user.role]) return false
  return !!permissions[user.role][key]
}
