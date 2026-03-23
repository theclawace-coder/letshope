import { test as base } from '@playwright/test'

type AuthRole = 'director' | 'admin' | 'worker' | 'plan_manager'

interface AuthFixtures {
  role: AuthRole
}

/**
 * Extended test fixture that supports role-based authentication.
 * Usage: test.use({ role: 'admin' }) in describe blocks
 * Default: director role (./e2e/.auth/user.json)
 */
export const test = base.extend<AuthFixtures>({
  role: ['director', { option: true }],
  storageState: async ({ role }, use) => {
    const stateMap: Record<AuthRole, string> = {
      director: './e2e/.auth/user.json',
      admin: './e2e/.auth/admin.json',
      worker: './e2e/.auth/worker.json',
      plan_manager: './e2e/.auth/plan-manager.json',
    }
    await use(stateMap[role])
  },
})

export { expect } from '@playwright/test'
