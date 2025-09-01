import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const CLIENTS_FILE = path.join(process.cwd(), "public", "exports", "clients.json")

// Read all clients from the single JSON file
function readClients() {
  if (!fs.existsSync(CLIENTS_FILE)) {
    return []
  }
  const fileContent = fs.readFileSync(CLIENTS_FILE, "utf-8")
  const data = JSON.parse(fileContent)
  return data.clients || []
}

// Write all clients to the single JSON file
function writeClients(clients: any[]) {
  const exportDir = path.dirname(CLIENTS_FILE)
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true })
  }

  const data = { clients, lastUpdated: new Date().toISOString() }
  fs.writeFileSync(CLIENTS_FILE, JSON.stringify(data, null, 2))
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const clients = readClients()
    const client = clients.find((c: any) => c.id === id)

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    return NextResponse.json({ client })
  } catch (error) {
    console.error("Error fetching client:", error)
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const updatedData = await req.json()
    const clients = readClients()

    const clientIndex = clients.findIndex((c: any) => c.id === id)

    if (clientIndex === -1) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Update the client with new data, preserving the original createdAt
    const updatedClient = {
      ...clients[clientIndex],
      ...updatedData,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    }

    clients[clientIndex] = updatedClient
    writeClients(clients)

    return NextResponse.json({ success: true, client: updatedClient })
  } catch (error) {
    console.error("Error updating client:", error)
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const clients = readClients()

    const clientIndex = clients.findIndex((c: any) => c.id === id)

    if (clientIndex === -1) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Remove the client
    clients.splice(clientIndex, 1)
    writeClients(clients)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting client:", error)
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 })
  }
}
