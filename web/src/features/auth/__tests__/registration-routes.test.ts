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
import { describe, expect, test } from 'vitest'

import { Route as registerRoute } from '@/routes/(auth)/register'
import { Route as signUpRoute } from '@/routes/(auth)/sign-up'

type AuthRoute = {
  options: {
    beforeLoad: (context: {
      location: { search: Record<string, string> }
    }) => never
  }
}

function getRedirect(route: AuthRoute) {
  try {
    route.options.beforeLoad({ location: { search: { redirect: '/keys' } } })
  } catch (error: unknown) {
    return error as {
      options: {
        to: string
        search: Record<string, string>
        replace: boolean
        statusCode: number
      }
    }
  }
  throw new Error('Expected the route to redirect')
}

describe('registration route compatibility', () => {
  test.each([
    ['sign-up', signUpRoute],
    ['register', registerRoute],
  ])(
    '%s redirects to the sign-in page without dropping search params',
    (_, route) => {
      const redirect = getRedirect(route as unknown as AuthRoute)

      expect(redirect.options).toEqual({
        to: '/sign-in',
        search: { redirect: '/keys' },
        replace: true,
        statusCode: 307,
      })
    }
  )
})
