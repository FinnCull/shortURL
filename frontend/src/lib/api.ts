export interface FieldError {
  field: string
  message: string
}

/** Thrown when the backend rejects a request. `fieldErrors` is populated for 400 validation responses. */
export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: FieldError[]

  constructor(status: number, message: string, fieldErrors: FieldError[] = []) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export interface CreateUrlRequest {
  originalUrl: string
  /** ISO-8601 local date-time, e.g. 2027-01-01T00:00:00 */
  expiryDate: string
}

export async function createShortUrl(request: CreateUrlRequest): Promise<string> {
  let res: Response
  try {
    res = await fetch('/createURL', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
  } catch {
    throw new ApiError(0, "Couldn't reach the server. Is the backend running?")
  }

  if (res.ok) return (await res.text()).trim()

  if (res.status === 400) {
    const body = await res.json().catch(() => null)
    const errors: FieldError[] = Array.isArray(body?.errors) ? body.errors : []
    throw new ApiError(400, errors[0]?.message ?? 'Invalid request', errors)
  }

  const text = await res.text().catch(() => '')
  throw new ApiError(res.status, text || `Something went wrong (${res.status})`)
}
