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
import { Mic, Radio, Square } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  CodeBlock,
  CodeBlockCopyButton,
} from '@/components/ai-elements/code-block'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const FUNASR_WEBSOCKET_URL = 'ws://10.17.150.235:10095'

const FUNASR_EXAMPLE = `const ws = new WebSocket('${FUNASR_WEBSOCKET_URL}')
const stream = await navigator.mediaDevices.getUserMedia({
  audio: { channelCount: 1, sampleRate: 16000 },
})
const audioContext = new AudioContext({ sampleRate: 16000 })
const source = audioContext.createMediaStreamSource(stream)
const processor = audioContext.createScriptProcessor(4096, 1, 1)

processor.onaudioprocess = (event) => {
  const input = event.inputBuffer.getChannelData(0)
  const pcm16 = new Int16Array(input.length)
  for (let index = 0; index < input.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, input[index]))
    pcm16[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
  }
  if (ws.readyState === WebSocket.OPEN) ws.send(pcm16.buffer)
}

ws.onmessage = (event) => {
  const { text } = JSON.parse(event.data)
  console.log(text)
}

source.connect(processor)
// Send { type: 'end' } after the final audio frame.`

export function FunasrWebSocketDemo() {
  const { t } = useTranslation()
  const audioContextRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isRecognizing, setIsRecognizing] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [transcript, setTranscript] = useState('')

  const stopRecognition = useCallback(() => {
    processorRef.current?.disconnect()
    processorRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    void audioContextRef.current?.close()
    audioContextRef.current = null

    const socket = socketRef.current
    if (socket?.readyState === WebSocket.CONNECTING) {
      socketRef.current = null
      socket.close()
    }
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'end' }))
      setIsStopping(true)
      return
    }
    setIsConnecting(false)
    setIsRecognizing(false)
  }, [])

  useEffect(() => stopRecognition, [stopRecognition])

  const startRecognition = async () => {
    if (isConnecting || isRecognizing || isStopping) return

    setTranscript(t('Connecting to the speech recognition service...'))
    setIsConnecting(true)
    setIsStopping(false)
    const socket = new WebSocket(FUNASR_WEBSOCKET_URL)
    socketRef.current = socket

    socket.addEventListener('open', async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { channelCount: 1, sampleRate: 16000 },
        })
        if (socketRef.current !== socket || socket.readyState !== WebSocket.OPEN) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        const audioContext = new AudioContext({ sampleRate: 16000 })
        const source = audioContext.createMediaStreamSource(stream)
        const processor = audioContext.createScriptProcessor(4096, 1, 1)
        const silentGain = audioContext.createGain()
        silentGain.gain.value = 0

        processor.onaudioprocess = (event) => {
          const input = event.inputBuffer.getChannelData(0)
          const pcm16 = new Int16Array(input.length)
          for (let index = 0; index < input.length; index += 1) {
            const sample = Math.max(-1, Math.min(1, input[index]))
            pcm16[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
          }
          if (socket.readyState === WebSocket.OPEN) socket.send(pcm16.buffer)
        }

        source.connect(processor)
        processor.connect(silentGain)
        silentGain.connect(audioContext.destination)
        audioContextRef.current = audioContext
        processorRef.current = processor
        streamRef.current = stream
        setTranscript(t('Listening...'))
        setIsRecognizing(true)
      } catch {
        socket.close()
        setTranscript(t('Microphone access was not granted.'))
      } finally {
        setIsConnecting(false)
      }
    })

    socket.addEventListener('message', (event) => {
      try {
        const data: unknown = JSON.parse(event.data)
        if (
          typeof data === 'object' &&
          data !== null &&
          'text' in data &&
          typeof data.text === 'string'
        ) {
          setTranscript(data.text)
        }
      } catch {
        setTranscript(t('Received an invalid recognition response.'))
      }
    })

    socket.addEventListener('error', () => {
      setTranscript(t('Unable to connect to the speech recognition service.'))
    })

    socket.addEventListener('close', () => {
      if (socketRef.current !== socket) return
      socketRef.current = null
      setIsConnecting(false)
      setIsRecognizing(false)
      setIsStopping(false)
      setTranscript((current) =>
        current ? `${current}\n${t('[Recognition ended]')}` : t('[Recognition ended]')
      )
    })
  }

  return (
    <div className='space-y-5'>
      <div className='flex flex-wrap items-center gap-x-4 gap-y-2 text-sm'>
        <span className='text-muted-foreground'>{t('Service endpoint')}</span>
        <code className='rounded border bg-muted px-2 py-1 font-mono text-xs'>
          {FUNASR_WEBSOCKET_URL}
        </code>
        <Badge variant='outline'>{t('PCM16, 16 kHz, mono')}</Badge>
      </div>

      <div className='grid gap-4'>
        <div className='space-y-3'>
          <div className='flex flex-wrap gap-2'>
            <Button
              onClick={() => void startRecognition()}
              disabled={isConnecting || isRecognizing || isStopping}
            >
              <Mic aria-hidden='true' />
              {isConnecting ? t('Connecting...') : t('Start recognition')}
            </Button>
            <Button
              variant='outline'
              onClick={stopRecognition}
              disabled={!isConnecting && (!isRecognizing || isStopping)}
            >
              <Square aria-hidden='true' />
              {t('Stop recognition')}
            </Button>
          </div>
          <div
            aria-live='polite'
            className='bg-muted/35 min-h-28 whitespace-pre-wrap rounded-lg border p-4 text-sm leading-6'
          >
            {transcript || t('Recognition text will appear here.')}
          </div>
        </div>

        <div className='border-lime-500/30 bg-lime-500/5 flex items-start gap-3 rounded-lg border p-4 text-sm leading-6'>
          <Radio className='mt-0.5 size-4 shrink-0 text-lime-700 dark:text-lime-400' aria-hidden='true' />
          <p className='text-muted-foreground'>
            {t(
              'FunASR accepts a streaming PCM16 audio buffer and returns transcription text in each WebSocket message.'
            )}
          </p>
        </div>
      </div>

      <div>
        <h3 className='mb-2 text-sm font-medium'>{t('WebSocket example')}</h3>
        <CodeBlock code={FUNASR_EXAMPLE} language='javascript' showToolbar title='JavaScript'>
          <CodeBlockCopyButton />
        </CodeBlock>
      </div>
    </div>
  )
}
