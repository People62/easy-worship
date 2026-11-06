// Electron wraps errors thrown in the main process as
// "Error invoking remote method 'x': Error: message". Keep only the message.
export function errorMessage(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error)
  return text.replace(/^Error invoking remote method '[^']+': (Error: )?/, '')
}
