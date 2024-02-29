'use server'

import { lucia } from '@/lib/auth'
import { db } from '@/lib/db'
import { ActionResult } from '@/types/auth.types'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Argon2id } from 'oslo/password'

export async function login(formData: FormData): Promise<ActionResult> {
	const username = formData.get('username')
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

	const existingUser = await db.user.findUnique({ where: { username } })
	if (!existingUser) {
		return {
			error: 'There is no user with such username'
		}
	}

	const validPassword = new Argon2id().verify(
		existingUser.hashed_password,
		password
	)

	if (!validPassword) return { error: 'Incorrect username or password' }

	const session = await lucia.createSession(existingUser.id, {})
	const sessionCookie = lucia.createSessionCookie(session.id)
	cookies().set(
		sessionCookie.name,
		sessionCookie.value,
		sessionCookie.attributes
	)
	return redirect('/')
}
