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

import { buildApiExamples, normalizeAvailableModels } from '../examples'

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
})
