/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
*/
import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { OneLoginForm } from '../one-login-form'

vi.mock('@/hooks/use-status', () => ({
  useStatus: () => ({ status: null }),
}))

describe('ONE Login form', () => {
  test('starts ONE Login without exposing local login methods', () => {
    render(<OneLoginForm redirectTo='/keys' />)

    const loginButton = screen.getByRole('button', {
      name: 'Continue with ONE Login',
    })
    expect(loginButton).toHaveAttribute(
      'href',
      '/auth/one-login/login?redirect=%2Fkeys'
    )
    expect(screen.queryByLabelText('Username or Email')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()
  })
})
