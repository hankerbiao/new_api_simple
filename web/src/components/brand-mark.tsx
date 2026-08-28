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
import { Orbit } from 'lucide-react'

import { cn } from '@/lib/utils'

interface BrandMarkProps {
  className?: string
}

export function BrandMark(props: BrandMarkProps) {
  return (
    <span
      aria-hidden='true'
      className={cn(
        'bg-foreground text-background inline-flex shrink-0 items-center justify-center rounded-[0.65rem] shadow-sm',
        props.className
      )}
    >
      <Orbit className='size-[62%] stroke-[1.8]' />
    </span>
  )
}
