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
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { Loader2, LogIn } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { z } from 'zod'

import { PasswordInput } from '@/components/password-input'
import { Turnstile } from '@/components/turnstile'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { adminLogin } from '@/features/auth/api'
import { LegalConsent } from '@/features/auth/components/legal-consent'
import { loginFormSchema } from '@/features/auth/constants'
import { useAuthRedirect } from '@/features/auth/hooks/use-auth-redirect'
import { useTurnstile } from '@/features/auth/hooks/use-turnstile'
import { useStatus } from '@/hooks/use-status'
import { isAuthBundle } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'

export function AdminLoginForm() {
  const { t } = useTranslation()
  const { status } = useStatus()
  const [isLoading, setIsLoading] = useState(false)
  const [agreedToLegal, setAgreedToLegal] = useState(false)
  const [turnstileWidgetKey, setTurnstileWidgetKey] = useState(0)
  const hasUserAgreement = Boolean(status?.user_agreement_enabled)
  const hasPrivacyPolicy = Boolean(status?.privacy_policy_enabled)
  const requiresLegalConsent = hasUserAgreement || hasPrivacyPolicy
  const {
    isTurnstileEnabled,
    turnstileSiteKey,
    turnstileToken,
    setTurnstileToken,
    validateTurnstile,
  } = useTurnstile()
  const { handleLoginSuccess, redirectTo2FA } = useAuthRedirect()
  const setPending2FAFlowToken = useAuthStore(
    (state) => state.auth.setPending2FAFlowToken
  )
  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { username: '', password: '' },
  })

  useEffect(() => {
    setAgreedToLegal(!requiresLegalConsent)
  }, [requiresLegalConsent])

  async function onSubmit(data: z.infer<typeof loginFormSchema>) {
    if (requiresLegalConsent && !agreedToLegal) {
      toast.error(t('Please agree to the legal terms first'))
      return
    }
    if (!validateTurnstile()) return

    const submittedTurnstileToken = turnstileToken
    if (isTurnstileEnabled) {
      setTurnstileToken('')
      setTurnstileWidgetKey((current) => current + 1)
    }

    setIsLoading(true)
    try {
      const response = await adminLogin({
        username: data.username,
        password: data.password,
        turnstile: submittedTurnstileToken,
      })
      if (!response.success) return

      if (
        response.data &&
        'require_2fa' in response.data &&
        response.data.require_2fa
      ) {
        if (!response.data.flow_token) {
          throw new Error(t('Login flow expired. Please sign in again.'))
        }
        setPending2FAFlowToken(response.data.flow_token)
        redirectTo2FA()
        return
      }
      if (!isAuthBundle(response.data)) {
        throw new Error(t('Login failed'))
      }
      await handleLoginSuccess(response.data)
      toast.success(t('Welcome back!'))
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) return
      toast.error(error instanceof Error ? error.message : t('Login failed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='grid gap-5'>
        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Administrator username')}</FormLabel>
              <FormControl>
                <Input
                  autoComplete='username'
                  className='h-11'
                  placeholder={t('Administrator username')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Password')}</FormLabel>
              <FormControl>
                <PasswordInput
                  autoComplete='current-password'
                  className='h-11'
                  placeholder={t('Enter password')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {isTurnstileEnabled && (
          <div className='flex justify-center'>
            <Turnstile
              key={turnstileWidgetKey}
              siteKey={turnstileSiteKey}
              onVerify={setTurnstileToken}
              onExpire={() => setTurnstileToken('')}
            />
          </div>
        )}
        <LegalConsent
          status={status}
          checked={agreedToLegal}
          onCheckedChange={setAgreedToLegal}
        />
        <Button
          type='submit'
          className='h-11 w-full justify-center gap-2'
          disabled={isLoading || (requiresLegalConsent && !agreedToLegal)}
        >
          {isLoading ? <Loader2 className='animate-spin' /> : <LogIn />}
          {t('Administrator sign in')}
        </Button>
      </form>
    </Form>
  )
}
