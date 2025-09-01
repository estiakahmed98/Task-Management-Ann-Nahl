import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const CLIENTS_FILE = path.join(process.cwd(), "public", "exports", "clients.json")

// Ensure the exports directory and clients.json file exist
function ensureClientsFile() {
  const exportDir = path.dirname(CLIENTS_FILE)

  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true })
  }

  if (!fs.existsSync(CLIENTS_FILE)) {
    fs.writeFileSync(CLIENTS_FILE, JSON.stringify({ clients: [] }, null, 2))
  }
}

// Read all clients from the single JSON file
function readClients() {
  ensureClientsFile()

  const fileContent = fs.readFileSync(CLIENTS_FILE, "utf-8")

  const data = JSON.parse(fileContent)

  return data.clients || []
}

// Write all clients to the single JSON file
function writeClients(clients: any[]) {
  ensureClientsFile()
  const data = { clients, lastUpdated: new Date().toISOString() }
  fs.writeFileSync(CLIENTS_FILE, JSON.stringify(data, null, 2))
}

export async function GET(req: NextRequest) {
  try {
    const clients = readClients()

    // Sort by creation date (newest first)
    clients.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return NextResponse.json({ clients })
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const newClient = await req.json()
    const clients = readClients()

    // Add timestamps
    const clientWithTimestamp = {
      ...newClient,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    clients.push(clientWithTimestamp)
    writeClients(clients)

    return NextResponse.json({ success: true, client: clientWithTimestamp })
  } catch (error) {
    console.error("Error creating client:", error)
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 })
  }
}
