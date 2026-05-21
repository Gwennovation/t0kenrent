import { useState } from 'react'
import type { GetServerSideProps } from 'next'
import Head from 'next/head'
import { getSessionUser } from '@/lib/auth-middleware'

interface PlatformStats {
  users: number
  assets: number
  activeRentals: number
  escrowsTotal: number
}

interface AdminUser {
  _id: string
  publicKey: string
  walletType: string
  role: 'user' | 'admin'
  totalListings: number
  totalRentals: number
  createdAt: string
}

interface Props {
  handle: string
  stats: PlatformStats | null
  users: AdminUser[]
  totalUsers: number
  statsError: string | null
  usersError: string | null
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
  const user = await getSessionUser(req as any)

  if (!user || user.role !== 'admin') {
    return { redirect: { destination: '/?auth=forbidden', permanent: false } }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const headers = { Cookie: req.headers.cookie || '' }

  const [statsRes, usersRes] = await Promise.allSettled([
    fetch(`${baseUrl}/api/admin/stats`, { headers }),
    fetch(`${baseUrl}/api/admin/users?limit=20`, { headers }),
  ])

  let stats: PlatformStats | null = null
  let statsError: string | null = null
  let users: AdminUser[] = []
  let totalUsers = 0
  let usersError: string | null = null

  if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
    const data = await statsRes.value.json()
    stats = data.stats
  } else {
    statsError = 'Failed to load platform stats'
  }

  if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
    const data = await usersRes.value.json()
    users = data.users ?? []
    totalUsers = data.total ?? 0
  } else {
    usersError = 'Failed to load user list'
  }

  return {
    props: {
      handle: user.handle,
      stats,
      users,
      totalUsers,
      statsError,
      usersError,
    },
  }
}

function StatTile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="p-5 bg-surface-900 border border-surface-800 rounded-xl">
      <p className="text-xs font-medium text-surface-500 uppercase tracking-widest mb-2">{label}</p>
      <p className="text-3xl font-bold text-white font-mono-financial tabular-nums">{value}</p>
      {sub && <p className="text-xs text-surface-600 mt-1">{sub}</p>}
    </div>
  )
}

export default function AdminDashboard({ handle, stats, users: initialUsers, totalUsers, statsError, usersError }: Props) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [roleError, setRoleError] = useState<string | null>(null)

  async function toggleRole(userId: string, currentRole: 'user' | 'admin') {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    setUpdatingId(userId)
    setRoleError(null)

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, role: newRole }),
      })
      if (res.ok) {
        setUsers(prev =>
          prev.map(u => u._id === userId ? { ...u, role: newRole } : u)
        )
      } else {
        const data = await res.json()
        setRoleError(data.error || 'Failed to update role')
      }
    } catch {
      setRoleError('Network error updating role')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <>
      <Head>
        <title>Admin — T0kenRent</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-surface-950 text-white">

        {/* Admin header — visually distinct from user shell */}
        <header className="sticky top-0 z-50 border-b border-surface-800 bg-surface-950/90 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-3">
                <img src="/t0kenrent-logo.png" alt="T0kenRent" className="w-7 h-7 object-contain" />
                <span className="text-sm font-semibold text-white">T0kenRent</span>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-md">
                  Admin
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-xs text-surface-500">{handle}</span>
                <a
                  href="/"
                  className="px-3 py-1.5 text-xs font-medium text-surface-400 hover:text-surface-200 border border-surface-800 hover:border-surface-700 rounded-lg transition-colors"
                >
                  ← Back to app
                </a>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

          {/* Page title */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Platform overview</h1>
            <p className="text-sm text-surface-500 mt-1">Real-time stats and user management.</p>
          </div>

          {/* Stats grid */}
          {statsError ? (
            <div className="mb-8 p-4 bg-red-950/50 border border-red-900/50 rounded-xl text-xs text-red-400">
              {statsError}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
              <StatTile label="Total users"    value={stats?.users ?? '—'}        sub="registered accounts" />
              <StatTile label="Listings"       value={stats?.assets ?? '—'}       sub="active assets" />
              <StatTile label="Active rentals" value={stats?.activeRentals ?? '—'} sub="in progress" />
              <StatTile label="Escrows"        value={stats?.escrowsTotal ?? '—'} sub="lifetime" />
            </div>
          )}

          {/* User management */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-surface-200 uppercase tracking-widest">
                Users
              </h2>
              <span className="text-xs text-surface-500">{totalUsers} total</span>
            </div>

            {roleError && (
              <div className="mb-4 p-3 bg-red-950/50 border border-red-900/50 rounded-xl text-xs text-red-400 flex items-center justify-between gap-3">
                {roleError}
                <button type="button" onClick={() => setRoleError(null)} className="shrink-0 text-red-600 hover:text-red-400 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {usersError ? (
              <div className="p-4 bg-red-950/50 border border-red-900/50 rounded-xl text-xs text-red-400">
                {usersError}
              </div>
            ) : users.length === 0 ? (
              <div className="p-10 border border-surface-800 rounded-xl text-center text-sm text-surface-500">
                No users yet.
              </div>
            ) : (
              <div className="border border-surface-800 rounded-xl overflow-hidden">
                {/* Table header */}
                <div className="hidden sm:grid grid-cols-[1fr_100px_80px_80px_120px] gap-4 px-5 py-3 border-b border-surface-800 bg-surface-900/50">
                  <p className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider">Identifier</p>
                  <p className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider">Wallet</p>
                  <p className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider text-right">Listings</p>
                  <p className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider text-right">Rentals</p>
                  <p className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider text-right">Role</p>
                </div>

                {/* Table rows */}
                <div className="divide-y divide-surface-800">
                  {users.map((u, i) => (
                    <div
                      key={u._id}
                      className={`px-4 sm:px-5 py-3.5 sm:grid sm:grid-cols-[1fr_100px_80px_80px_120px] sm:gap-4 sm:items-center animate-slide-up`}
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      <div className="min-w-0 mb-2 sm:mb-0">
                        <p className="text-sm font-medium text-white font-mono-financial truncate">
                          {u.publicKey.length > 30
                            ? `${u.publicKey.slice(0, 16)}…${u.publicKey.slice(-8)}`
                            : u.publicKey}
                        </p>
                        <p className="text-xs text-surface-600 mt-0.5">
                          {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>

                      <div className="sm:block flex items-center gap-3 mb-2 sm:mb-0">
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-surface-800 text-surface-400 border border-surface-700 uppercase tracking-wider">
                          {u.walletType}
                        </span>
                      </div>

                      <p className="hidden sm:block text-sm text-surface-300 font-mono-financial text-right">{u.totalListings}</p>
                      <p className="hidden sm:block text-sm text-surface-300 font-mono-financial text-right">{u.totalRentals}</p>

                      <div className="flex sm:justify-end">
                        <button
                          type="button"
                          onClick={() => toggleRole(u._id, u.role)}
                          disabled={updatingId === u._id}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                            u.role === 'admin'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                              : 'bg-surface-800 text-surface-400 border-surface-700 hover:bg-surface-700 hover:text-surface-200'
                          }`}
                        >
                          {updatingId === u._id ? (
                            <span className="flex items-center gap-1.5">
                              <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Saving
                            </span>
                          ) : u.role === 'admin' ? 'Admin' : 'User'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {totalUsers > users.length && (
              <p className="mt-3 text-xs text-surface-600 text-center">
                Showing {users.length} of {totalUsers} users.
              </p>
            )}
          </section>
        </main>
      </div>
    </>
  )
}
