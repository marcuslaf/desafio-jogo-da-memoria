import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Jogo da Memoria",
  description: "Um jogo da memoria divertido com emojis de animais",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br">
      <body className="min-h-screen flex items-center justify-center"
        style={{ background: "#fc1e8a" }}>
        {children}
      </body>
    </html>
  )
}
