'use server'

import { generateId } from 'lucia'
import { Argon2id } from 'oslo/password'
import { db } from './lib/db'
import { lucia } from './lib/auth'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

interface ActionResult {
	error: string
}

export async function signup(formData: FormData): Promise<ActionResult> {
	const username = formData.get('username')
	console.log('Creating...')
	const existingUser = await db.user.findUnique({
		where: {
			username: username as string // should I use "as string" here?
		}
	})
	if (existingUser) {
		return {
			error: 'Username already in use'
		}
	}
	if (
		typeof username !== 'string' ||
		username.length < 3 ||
		username.length > 31 ||
		!/^[a-z0-9_-]+$/.test(username)
	) {
		return {
			error: 'Invalid username'
		}
	}
	const password = formData.get('password')
	if (
		typeof password !== 'string' ||
		password.length < 6 ||
		password.length > 255
	) {
		return {
			error: 'Invalid password'
		}
	}

	const hashedPassword = await new Argon2id().hash(password)
	const userId = generateId(15)

	await db.user.create({
		data: {
			id: userId,
			username: username,
			hashed_password: hashedPassword
		}
	})

	const session = await lucia.createSession(userId, {})
	const sessionCookie = lucia.createSessionCookie(session.id)

	cookies().set(
		sessionCookie.name,
		sessionCookie.value,
		sessionCookie.attributes
	)

	return redirect('/')
}
