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
import { LogIn } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { LegalConsent } from '@/features/auth/components/legal-consent'
import { useStatus } from '@/hooks/use-status'

interface OneLoginFormProps {
  redirectTo?: string
}

export function OneLoginForm(props: OneLoginFormProps) {
  const { t } = useTranslation()
  const { status } = useStatus()
  const [agreedToLegal, setAgreedToLegal] = useState(false)
  const hasUserAgreement = Boolean(status?.user_agreement_enabled)
  const hasPrivacyPolicy = Boolean(status?.privacy_policy_enabled)
  const requiresLegalConsent = hasUserAgreement || hasPrivacyPolicy

  useEffect(() => {
    setAgreedToLegal(!requiresLegalConsent)
  }, [requiresLegalConsent])

  const query = new URLSearchParams()
  if (props.redirectTo) {
    query.set('redirect', props.redirectTo)
  }
  const href = `/auth/one-login/login${query.size ? `?${query}` : ''}`
  const isDisabled = requiresLegalConsent && !agreedToLegal

  return (
    <div className='grid gap-5'>
      <LegalConsent
        status={status}
        checked={agreedToLegal}
        onCheckedChange={setAgreedToLegal}
      />
      <Button
        className='h-11 w-full justify-center gap-2'
        disabled={isDisabled}
        render={<a href={isDisabled ? undefined : href} />}
      >
        <LogIn aria-hidden='true' />
        {t('Continue with ONE Login')}
      </Button>
    </div>
  )
}
