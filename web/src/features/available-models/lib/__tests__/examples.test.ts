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
import { describe, expect, test } from 'vitest'

import {
  buildApiExamples,
  getApiExampleEndpoint,
  normalizeAvailableModels,
} from '../examples'

describe('available model examples', () => {
  test('normalizes duplicate and blank model names for the user list', () => {
    expect(
      normalizeAvailableModels([' gpt-4o ', '', 'gpt-4o', 'claude-3'])
    ).toEqual(['claude-3', 'gpt-4o'])
  })

  test('keeps the selected model and gateway endpoint in every request example', () => {
    const examples = buildApiExamples(
      'https://gateway.example.com/v1/chat/completions',
      'gpt-4o'
    )

    expect(examples).toHaveLength(3)
    for (const example of examples) {
      expect(example.code).toContain('gpt-4o')
      expect(example.code).toContain('gateway.example.com')
      expect(example.code).toContain('sk-...')
    }
  })

  test('uses the embeddings endpoint and payload for embedding models', () => {
    const endpoint = getApiExampleEndpoint(
      'https://gateway.example.com/v1/chat/completions',
      'embedding'
    )
    const examples = buildApiExamples(
      'https://gateway.example.com/v1/chat/completions',
      'embedding'
    )

    expect(endpoint).toEqual({
      url: 'https://gateway.example.com/v1/embeddings',
      requestType: 'embedding',
    })
    expect(examples[0]?.code).toContain('/v1/embeddings')
    expect(examples[0]?.code).toContain('"input":["Text to embed"]')
    expect(examples[1]?.code).toContain('client.embeddings.create')
  })

  test('uses the rerank endpoint and payload for rerank models', () => {
    const endpoint = getApiExampleEndpoint(
      'https://gateway.example.com/v1/chat/completions',
      'reranker'
    )
    const examples = buildApiExamples(
      'https://gateway.example.com/v1/chat/completions',
      'reranker'
    )

    expect(endpoint).toEqual({
      url: 'https://gateway.example.com/v1/rerank',
      requestType: 'rerank',
    })
    expect(examples[0]?.code).toContain('/v1/rerank')
    expect(examples[0]?.code).toContain('"documents"')
    expect(examples[1]?.code).toContain('urlopen(request)')
  })
})
