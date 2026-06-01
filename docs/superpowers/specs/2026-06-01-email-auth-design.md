# Email/Password Auth + Admin Password Reset — Design Spec
**Date:** 2026-06-01
**Status:** Approved
**Feature:** Add email/password login alongside Google OAuth; allow Principal to send password-reset emails to any user from the Team page.

---

## 1. Goal

Add a second login method (email + password) to ArcFlow CRM so users who don't use Google can still sign in. Allow self-registration (new users land as `pending` until the Principal assigns a role). Give the Principal the ability to trigger a Supabase password-reset email for any user directly from the Team page.

---

## 2. Auth Flow

### Sign In
- Login page shows two tabs: **Sign In** and **Sign Up**
- Both tabs show a **"Sign in with Google"** button
- **Sign In tab** also shows email + password fields with a "Sign In" submit button
- **Sign Up tab** shows name + email + password fields with a "Create Account" submit button
- On successful email sign-up, Supabase fires the existing `handle_new_user()` trigger → profile row created with `role = 'pending'` → user sees the Pending screen

### Password Reset (user-initiated)
Not in scope — admin-initiated only (see below).

### Password Reset (admin-initiated)
1. Principal goes to Team page
2. Sees a **"Reset Password"** button next to each staff and client row (Principal only)
3. Clicking it calls `supabase.auth.resetPasswordForEmail(user.email, { redirectTo: window.location.origin + '/reset-password' })`
4. Supabase sends the user an email with a reset link
5. A success message is shown inline: "Reset email sent to [email]"

### Reset Password Page
1. User clicks the link in their email → browser navigates to `yourapp.com/#access_token=xxx&type=recovery`
2. `App.jsx` detects `type=recovery` in the URL hash on mount and navigates to `/reset-password`
3. `ResetPassword.jsx` shows a form: **New Password** + **Confirm Password** fields
4. On submit: `supabase.auth.updateUser({ password: newPassword })`
5. On success: navigate to `/dashboard`
6. On error: show inline error message

---

## 3. Components

### Modified: `src/pages/Login.jsx`
- Add `activeTab` state: `'signin'` | `'signup'`
- Sign In tab: email input + password input + "Sign In" button + Google button
- Sign Up tab: name input + email input + password input + "Create Account" button + Google button
- Show inline error messages for wrong credentials / email already in use
- Uses `signInWithEmail` and `signUpWithEmail` from AuthContext

### Modified: `src/contexts/AuthContext.jsx`
Add two functions:
```js
async function signInWithEmail(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return { error }
}

async function signUpWithEmail(email, password, name) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } }
  })
  return { error }
}
```
Both exposed via context value.

### Modified: `src/App.jsx`
- Add `/reset-password` route → `<ResetPassword />`
- In `AppShell`, detect recovery session: if `session?.user` exists and URL hash contains `type=recovery`, navigate to `/reset-password`

### New: `src/pages/ResetPassword.jsx`
- Standalone page (no Sidebar/TopNavbar — shown outside the authenticated shell)
- Fields: New Password + Confirm Password
- Submit calls `supabase.auth.updateUser({ password })`
- Success → navigate to `/dashboard`
- Error → inline error message

### Modified: `src/pages/Team.jsx`
- Add `resetEmail` state: `null | string` (tracks which email had reset sent, for success message)
- In staff table row and client table row: add "Reset Password" button (Principal only)
- Button calls `supabase.auth.resetPasswordForEmail(user.email, { redirectTo: origin + '/reset-password' })`
- Show `"✓ Reset email sent"` inline next to the button for 3 seconds after success

---

## 4. Supabase Configuration Required

In Supabase dashboard → **Authentication → URL Configuration**:
- Add `https://yourapp.vercel.app/reset-password` to **Redirect URLs**

In Supabase dashboard → **Authentication → Providers → Email**:
- Ensure **Email provider** is enabled (it is by default)
- Optionally disable "Confirm email" for faster onboarding (users don't need to verify email before logging in)

---

## 5. Out of Scope

- User-initiated "Forgot Password" link on the login page (admin-only reset for now)
- Email confirmation requirement
- Password strength rules beyond Supabase defaults (minimum 6 characters)
