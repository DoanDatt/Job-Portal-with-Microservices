import type { Request, Response } from 'express'
import ErrorHandler from '../utils/errorHanler.js'
import { sql } from '../utils/db.js'
import { tryCatch } from '../utils/tryCatch.js'
import bcrypt from 'bcrypt'
import getBuffer from '../utils/buffer.js'
import axios from 'axios'
import jwt from 'jsonwebtoken'

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
    -- lấy phần tử đầu tiên của mảng
      VALUES (${name}, ${email}, ${hashPassword}, ${phoneNumber}, ${role} ) RETURNING user_id, name, email, phone_number, role, created_at `
    // VALUES: chèn dữ liệu vào bảng users, RETURNING: trả về các trường sau khi chèn thành công
    registerUser = user
    // if role is recruiter then insert into users table with name, email, password, phone_number, role and return user_id, name, email, phone_number, role and created_at
  } else if (role === 'jobseeker') {
    const file = req.file
    if (!file) {
      throw new ErrorHandler(400, 'resume file is required for jobseeker')
    }
    // if don't have file then throw error
    const fileBuffer = getBuffer(file)
    if (!fileBuffer || !fileBuffer.content) {
      throw new ErrorHandler(500, 'Failed to generate resume file buffer')
    }

    const { data } = await axios.post(`${process.env.UPLOAD_SERVICE}/api/utils/upload`, { buffer: fileBuffer.content })

    const [user] =
      await sql`INSERT INTO users (name, email, password, phone_number, role, bio, resume,resume_public_id) VALUES (${name}, ${email}, ${hashPassword}, ${phoneNumber}, ${role}, ${bio}, ${data.url}, ${data.public_id}) RETURNING user_id, name, email, phone_number, role,resume, bio, created_at `
    registerUser = user
    // if role is jobseeker then insert into users table with name, email, password, phone_number, role and return user_id, name, email, phone_number, role, bio and created_at
  }

  const token = jwt.sign({ id: registerUser?.user_id }, process.env.JWT_SECRET as string, {
    expiresIn: '7d'
  })

  res.json({
    message: 'User registered successfully',
    user: registerUser,
    token
  })
})

export const loginUser = tryCatch(async (req: Request, res: Response) => {
  const { email, password } = req.body

  if (!email || !password) {
    throw new ErrorHandler(400, 'Please fill email and password')
  }
  const user =
    await sql`SELECT u.user_id, u.name, u.email, u.password, u.phone_number, u.role, u.bio, u.resume,u.profile_pic,
    -- lấy thông tin từ bảng user
     ARRAY_AGG(s.name) FILTER (WHERE s.name IS NOT NULL) as skills 
     -- gom nhiều dòng thành 1 mảng, s.name: tên kĩ năng, filter: loại bỏ giá trị null
     FROM users u LEFT JOIN user_skills us ON u.user_id = us.user_id 
     -- lấy kĩ năng của user dựa vào user_id, ON là điều kiện nối
     LEFT JOIN skills s ON us.skill_id = s.skill_id WHERE u.email = ${email} GROUP BY u.user_id`
  // => lấy thông tin user và danh sách kĩ năng(skills) theo email
  if (user.length === 0) {
    throw new ErrorHandler(400, 'Invalid Credentials')
  }

  const userObject = user[0]!

  const matchPassword = await bcrypt.compare(password, userObject.password)
  // so sánh password nhập vào với password đã hash trong database

  if (!matchPassword) {
    throw new ErrorHandler(400, 'Invalid Credentials')
  }
  // nếu password không khớp thì throw error

  userObject.skills = userObject.skills || []
  // nếu user không có kĩ năng nào thì gán skills là mảng rỗng

  delete userObject.password
  // xóa trường password khỏi userObject để không trả về cho client

  const token = jwt.sign({ id: userObject.user_id }, process.env.JWT_SECRET as string, {
    expiresIn: '7d'
  })
  res.json({
    message: 'User logged in successfully',
    user: userObject,
    token
  })
})
