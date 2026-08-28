/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { Link, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { useStatus } from '@/hooks/use-status'

import { AuthLayout } from '../auth-layout'
import { TermsFooter } from '../components/terms-footer'
import { OneLoginForm } from './components/one-login-form'

export function SignIn() {
  const { t } = useTranslation()
  const { redirect, one_login: oneLoginStatus } = useSearch({
    from: '/(auth)/sign-in',
  })
  const { status } = useStatus()

  return (
    <AuthLayout>
      <div className='w-full space-y-7'>
        <div className='space-y-2 text-center'>
          <p className='text-muted-foreground text-xs font-medium uppercase'>
            {t('Secure access')}
          </p>
          <h2 className='text-2xl font-semibold sm:text-3xl'>{t('Sign in')}</h2>
          <p className='text-muted-foreground text-sm'>
            {t('Sign in to continue to your workspace')}
          </p>
        </div>

        {oneLoginStatus && (
          <p className='text-destructive text-center text-sm' role='alert'>
            {oneLoginStatus === 'unavailable'
              ? t(
                  'ONE Login is unavailable. Please contact your administrator.'
                )
              : t('ONE Login failed. Please try again.')}
          </p>
        )}

        <OneLoginForm redirectTo={redirect} />

        <div className='flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm'>
          <Link
            to='/forgot-password'
            className='text-muted-foreground hover:underline'
          >
            {t('Forgot password')}
          </Link>
          <Link
            to='/admin-sign-in'
            className='text-muted-foreground hover:underline'
          >
            {t('Administrator login')}
          </Link>
        </div>

        <TermsFooter
          variant='sign-in'
          status={status}
          className='text-center'
        />
      </div>
    </AuthLayout>
  )
}
