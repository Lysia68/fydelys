import { NextRequest } from "next/server"

export function createMockRequest(
  url: string,
  options: {
    method?: string
    body?: any
    headers?: Record<string, string>
    cookies?: Record<string, string>
  } = {}
): NextRequest {
  const { method = "GET", body, headers = {}, cookies = {} } = options

  const reqInit: any = {
    method,
    headers: {
      "content-type": "application/json",
      host: new URL(url).host,
      ...headers,
    },
  }

  if (body && method !== "GET") {
    reqInit.body = JSON.stringify(body)
  }

  const req = new NextRequest(url, reqInit)

  // Set cookies
  Object.entries(cookies).forEach(([name, value]) => {
    req.cookies.set(name, value)
  })

  return req
}

export function expectRedirectTo(response: Response, expectedUrl: string) {
  const location = response.headers.get("Location") || ""
  expect(location).toContain(expectedUrl)
}

export function expectJson(response: Response) {
  return response.json()
}
