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

For commercial licensing, please contact support@quantumnous.com
*/
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { AuthLayout } from '../auth-layout'
import { AdminLoginForm } from './components/admin-login-form'

export function AdminSignIn() {
  const { t } = useTranslation()

  return (
    <AuthLayout>
      <div className='w-full space-y-7'>
        <div className='space-y-2 text-center'>
          <p className='text-muted-foreground text-xs font-medium uppercase'>
            {t('Secure access')}
          </p>
          <h2 className='text-2xl font-semibold sm:text-3xl'>
            {t('Administrator sign in')}
          </h2>
          <p className='text-muted-foreground text-sm'>
            {t('Administrative access only')}
          </p>
        </div>

        <AdminLoginForm />

        <Link
          to='/forgot-password'
          className='text-muted-foreground block text-center text-sm hover:underline'
        >
          {t('Forgot password')}
        </Link>

        <Link
          to='/sign-in'
          className='text-muted-foreground block text-center text-sm hover:underline'
        >
          {t('Continue with ONE Login')}
        </Link>
      </div>
    </AuthLayout>
  )
}
