export interface GetApiTestDto {
  date: string
  nodeVersion: string // Node.js version string
  appVersion: string // Application version string
  resourceDir: string // Directory path as a string
  studioLinksDir: string // Directory path as a string
  studioPluginsDir: string // Directory path as a string
  watchDirectory: string // Directory path as a string
  gltfDirectory: string // Directory path as a string
  logsDirectory: string // Directory path as a string
}

export async function getApiTest(): Promise<GetApiTestDto> {
  const res = await fetch(`http://localhost:3000/api/test`)
  return await res.json()
}
