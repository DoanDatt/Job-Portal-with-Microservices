import type { Request, Response } from 'express'
import ErrorHandler from '../utils/errorHanler.js'
import { sql } from '../utils/db.js'
import { tryCatch } from '../utils/tryCatch.js'
import bcrypt from 'bcrypt'

export const registerUser = tryCatch(async (req: Request, res: Response) => {
  const { name, email, password, phoneNumber, role, bio } = req.body
  // get all details from req.body
  if (!name || !email || !password || !phoneNumber || !role) {
    throw new ErrorHandler(400, 'Please fill all details')
  }
  // if don't have all details then throw error
  const existingUser = await sql`SELECT * FROM users WHERE email = ${email}`
  if (existingUser.length > 0) {
    throw new ErrorHandler(409, 'User already exists')
  }
  // if user already exists then throw error

  const hashPassword = await bcrypt.hash(password, 10)

  let registerUser

  if (role === 'recruiter') {
    const [user] = await sql`INSERT INTO users (name, email, password, phone_number, role,)
      VALUES (${name}, ${email}, ${hashPassword}, ${phoneNumber}, ${role}, ) RETURNING user_id, name, email, phone_number, role, created_at `
    registerUser = user
    // if role is recruiter then insert into users table with name, email, password, phone_number, role and return user_id, name, email, phone_number, role and created_at
  } else if (role === 'jobseeker') {
    const file = req.file
    const [user] =
      await sql`INSERT INTO users (name, email, password, phone_number, role, ) VALUES (${name}, ${email}, ${hashPassword}, ${phoneNumber}, ${role}, ) RETURNING user_id, name, email, phone_number, role, bio, created_at `
    registerUser = user
    // if role is jobseeker then insert into users table with name, email, password, phone_number, role and return user_id, name, email, phone_number, role, bio and created_at
  }

  res.json({ email, password, name, phoneNumber, role, bio })
})
