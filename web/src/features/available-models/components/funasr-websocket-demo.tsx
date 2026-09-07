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
import { Radio } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  CodeBlock,
  CodeBlockCopyButton,
} from '@/components/ai-elements/code-block'
import { CardDescription } from '@/components/ui/card'

const FUNASR_WEBSOCKET_EXAMPLE = `const ws = new WebSocket('ws://10.17.150.235:10095')

ws.addEventListener('open', () => {
  console.log('connected')
})

function sendAudioChunk(pcm16Chunk) {
  if (ws.readyState === WebSocket.OPEN) ws.send(pcm16Chunk)
}

ws.addEventListener('message', (event) => {
  const { text } = JSON.parse(event.data)
  console.log(text)
})

function finishRecognition() {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'end' }))
  }
}

// Call sendAudioChunk for each PCM16 frame,
// then call finishRecognition after the final frame.`

export function FunasrWebSocketDemo() {
  const { t } = useTranslation()

  return (
    <div className='space-y-4'>
      <div className='flex items-start gap-3 text-sm leading-6'>
        <Radio className='mt-0.5 size-4 shrink-0 text-lime-700 dark:text-lime-400' aria-hidden='true' />
        <CardDescription>
          {t(
            'FunASR accepts a streaming PCM16 audio buffer and returns transcription text in each WebSocket message.'
          )}
        </CardDescription>
      </div>
      <div>
        <h4 className='mb-2 text-sm font-medium'>{t('WebSocket example')}</h4>
        <CodeBlock
          code={FUNASR_WEBSOCKET_EXAMPLE}
          language='javascript'
          showToolbar
          title='JavaScript'
        >
          <CodeBlockCopyButton />
        </CodeBlock>
      </div>
    </div>
  )
}
