import type { PropsWithChildren } from 'react'

export default function Layout({ children }: PropsWithChildren<unknown>) {
	return (
		<html>
			<body>{children}</body>
		</html>
	)
}
