import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"

export async function POST(req) {
  const { name, email, password } = await req.json()
  if (!email || !password) {
    return Response.json({ error: "Email and password required" }, { status: 400 })
  }

  const client = await clientPromise
  const users = client.db().collection("users")

  const existing = await users.findOne({ email })
  if (existing) {
    return Response.json({ error: "User already exists" }, { status: 400 })
  }

  const hashed = await bcrypt.hash(password, 10)
  await users.insertOne({ name, email, password: hashed })

  return Response.json({ message: "User registered successfully" })
}
