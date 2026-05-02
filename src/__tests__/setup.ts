import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mocking Next.js modules if needed
vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}))
