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
import { Activity, ArrowRight, Blocks, Server, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { BrandMark } from '@/components/brand-mark'
import { Button } from '@/components/ui/button'
import { useSystemConfig } from '@/hooks/use-system-config'

import { ApiCallExample } from '../api-call-example'

interface HeroProps {
  className?: string
  isAuthenticated?: boolean
}

export function Hero(props: HeroProps) {
  const { t } = useTranslation()
  const { systemName, logo } = useSystemConfig()

  return (
    <section className='bg-muted/20 border-border/60 relative overflow-hidden border-b px-6 pt-28 pb-16 md:pt-36 md:pb-24'>
      <div
        aria-hidden='true'
        className='pointer-events-none absolute top-20 right-[8%] size-44 rotate-12 border border-blue-500/20 md:size-72'
      />
      <div
        aria-hidden='true'
        className='bg-primary/10 pointer-events-none absolute top-40 right-[14%] size-20 -rotate-12 md:size-32'
      />

      <div className='relative mx-auto max-w-6xl'>
        <div className='grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20'>
          <div>
            <div className='flex items-center gap-3'>
              {logo === '/logo.png' ? (
                <BrandMark className='size-11 rounded-xl' />
              ) : (
                <img
                  src={logo}
                  alt={t('Logo')}
                  className='size-11 rounded-xl object-contain'
                />
              )}
              <div>
                <p className='text-sm font-semibold'>{systemName}</p>
                <p className='text-muted-foreground text-xs'>
                  {t('AI Gateway')}
                </p>
              </div>
            </div>

            <h1 className='mt-9 max-w-xl text-4xl leading-[1.08] font-semibold tracking-tight md:text-6xl'>
              {t('Unified API Gateway for')}{' '}
              <span className='text-primary'>
                {t('Vast Range of AI Models')}
              </span>
            </h1>
            <p className='text-muted-foreground mt-6 max-w-lg text-base leading-7'>
              {t(
                'Route, secure, and monitor AI traffic from one operational control plane.'
              )}
            </p>

            <div className='mt-9 flex flex-wrap items-center gap-3'>
              <Button
                className='h-11 rounded-lg px-5 text-sm font-medium'
                render={
                  <Link
                    to={props.isAuthenticated ? '/dashboard' : '/sign-up'}
                  />
                }
              >
                {props.isAuthenticated
                  ? t('Go to Dashboard')
                  : t('Get Started')}
                <ArrowRight className='ml-1.5 size-4' aria-hidden='true' />
              </Button>
            </div>

            <div className='text-muted-foreground mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs'>
              <span className='flex items-center gap-1.5'>
                <Server className='size-3.5 text-blue-600' aria-hidden='true' />
                {t('API endpoint')}{' '}
                <code className='text-foreground font-mono'>/v1</code>
              </span>
              <span className='flex items-center gap-1.5'>
                <ShieldCheck
                  className='size-3.5 text-emerald-600'
                  aria-hidden='true'
                />
                {t('Protected')}
              </span>
              <span className='flex items-center gap-1.5'>
                <Activity
                  className='size-3.5 text-amber-600'
                  aria-hidden='true'
                />
                {t('Online')}
              </span>
            </div>
          </div>

          <div className='relative'>
            <div className='border-border/60 bg-background absolute -top-5 -right-3 z-10 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs shadow-sm sm:right-5'>
              <Blocks className='size-3.5 text-blue-600' aria-hidden='true' />
              <span>{t('Multi-protocol Compatible')}</span>
            </div>
            <ApiCallExample />
          </div>
        </div>
      </div>
    </section>
  )
}
