import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Output } from './Output'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Output />
  </StrictMode>
)
