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
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { FunasrWebSocketDemo } from '../funasr-websocket-demo'

describe('FunASR WebSocket demo', () => {
  test('shows the speech recognition service description without test controls', () => {
    render(<FunasrWebSocketDemo />)

    expect(
      screen.getByText(
        'FunASR accepts a streaming PCM16 audio buffer and returns transcription text in each WebSocket message.'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('const ws = new WebSocket(\'ws://10.17.150.235:10095\')')).toBeInTheDocument()
    expect(screen.getByText('ws.send(JSON.stringify({ type: \'end\' }))')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Start recognition' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Stop recognition' })).not.toBeInTheDocument()
    expect(screen.queryByText('ws://10.17.150.235:10095')).not.toBeInTheDocument()
  })
})
