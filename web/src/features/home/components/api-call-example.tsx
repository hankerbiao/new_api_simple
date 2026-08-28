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
import { Check, Copy, Terminal } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { copyToClipboard } from '@/lib/copy-to-clipboard'
import { cn } from '@/lib/utils'

const API_CALL_EXAMPLE = `curl https://your-gateway.example.com/v1/chat/completions \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "your-model",
    "messages": [{"role": "user", "content": "Hello"}]
  }'`

interface ApiCallExampleProps {
  className?: string
}

export function ApiCallExample(props: ApiCallExampleProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const success = await copyToClipboard(API_CALL_EXAMPLE)
    setCopied(success)
  }

  return (
    <section
      aria-labelledby='api-call-example-title'
      className={cn(
        'border-border/60 bg-background/95 rounded-lg border p-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.45)]',
        props.className
      )}
    >
      <div className='flex items-start justify-between gap-4'>
        <div className='flex min-w-0 items-center gap-3'>
          <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400'>
            <Terminal className='size-4' aria-hidden='true' />
          </div>
          <div className='min-w-0'>
            <h2 id='api-call-example-title' className='text-sm font-semibold'>
              {t('Code samples')}
            </h2>
            <p className='text-muted-foreground mt-0.5 truncate text-xs'>
              {t(
                'Use our unified OpenAI-compatible endpoint in your applications'
              )}
            </p>
          </div>
        </div>
        <Button
          aria-label={t(copied ? 'Copied' : 'Copy to clipboard')}
          className='shrink-0'
          size='icon-sm'
          title={t(copied ? 'Copied' : 'Copy to clipboard')}
          variant='ghost'
          onClick={handleCopy}
        >
          {copied ? (
            <Check className='text-emerald-600' aria-hidden='true' />
          ) : (
            <Copy aria-hidden='true' />
          )}
        </Button>
      </div>

      <div className='border-border/60 bg-muted/40 mt-5 overflow-hidden rounded-lg border'>
        <div className='border-border/60 flex items-center gap-2 border-b px-4 py-2.5'>
          <span
            className='size-2 rounded-full bg-red-400/80'
            aria-hidden='true'
          />
          <span
            className='size-2 rounded-full bg-amber-400/80'
            aria-hidden='true'
          />
          <span
            className='size-2 rounded-full bg-emerald-400/80'
            aria-hidden='true'
          />
          <span className='text-muted-foreground ml-2 font-mono text-[10px]'>
            curl
          </span>
        </div>
        <pre className='text-foreground/90 overflow-x-auto p-4 font-mono text-xs leading-6'>
          <code>{API_CALL_EXAMPLE}</code>
        </pre>
      </div>
    </section>
  )
}
