"use client"

import { useState, useEffect, useCallback } from "react"

const EMOJIS = ["😺", "🦝", "🦊", "🐶", "🐵", "🦁", "🐰", "🐮"]

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

interface Card {
  id: number
  emoji: string
  isOpen: boolean
  isMatched: boolean
}

export default function MemoryGame() {
  const [cards, setCards] = useState<Card[]>([])
  const [openCards, setOpenCards] = useState<number[]>([])
  const [won, setWon] = useState(false)

  const initializeGame = useCallback(() => {
    const pairs = [...EMOJIS, ...EMOJIS]
    const shuffled = shuffleArray(pairs)
    setCards(
      shuffled.map((emoji, index) => ({
        id: index,
        emoji,
        isOpen: false,
        isMatched: false,
      }))
    )
    setOpenCards([])
    setWon(false)
  }, [])

  useEffect(() => {
    initializeGame()
  }, [initializeGame])

  useEffect(() => {
    if (openCards.length === 2) {
      const [first, second] = openCards
      const timer = setTimeout(() => {
        setCards((prev) => {
          const updated = [...prev]
          if (updated[first].emoji === updated[second].emoji) {
            updated[first] = { ...updated[first], isMatched: true }
            updated[second] = { ...updated[second], isMatched: true }
          } else {
            updated[first] = { ...updated[first], isOpen: false }
            updated[second] = { ...updated[second], isOpen: false }
          }
          return updated
        })
        setOpenCards([])
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [openCards])

  useEffect(() => {
    if (cards.length > 0 && cards.every((card) => card.isMatched)) {
      setWon(true)
    }
  }, [cards])

  function handleClick(index: number) {
    if (openCards.length >= 2) return
    if (cards[index].isOpen || cards[index].isMatched) return

    setCards((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], isOpen: true }
      return updated
    })
    setOpenCards((prev) => [...prev, index])
  }

  return (
    <div
      className="relative flex flex-col items-center justify-center gap-8 p-10 px-16"
      style={{
        background:
          "linear-gradient(325deg, #03001e 0%, #7303c0 30%, #ec38bc 70%, #fdeff9 100%)",
      }}
    >
      <h2 className="text-5xl font-bold text-white uppercase tracking-widest font-mono">
        Jogo da Memoria
      </h2>

      <div className="grid grid-cols-4 gap-2.5" style={{ perspective: "500px", transformStyle: "preserve-3d" }}>
        {cards.map((card, index) => (
          <button
            key={card.id}
            onClick={() => handleClick(index)}
            className="relative w-[100px] h-[100px] flex items-center justify-center text-5xl cursor-pointer border-none"
            style={{
              transformStyle: "preserve-3d",
              transform: card.isOpen || card.isMatched ? "rotateY(0deg)" : "rotateY(180deg)",
              transition: "transform 0.25s",
            }}
            aria-label={
              card.isOpen || card.isMatched
                ? `Card with ${card.emoji}`
                : "Face-down card"
            }
          >
            {/* Front face - emoji */}
            <span
              className="absolute inset-0 flex items-center justify-center bg-white text-5xl"
              style={{
                backfaceVisibility: "hidden",
              }}
            >
              {card.emoji}
            </span>
            {/* Back face - gradient */}
            <span
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(325deg, #03001e 0%, #7303c0 30%, #ec38bc 70%, #fdeff9 100%)",
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            />
          </button>
        ))}
      </div>

      {won && (
        <p className="text-2xl font-bold text-white font-mono tracking-wider">
          {"Voce venceu!"}
        </p>
      )}

      <button
        onClick={initializeGame}
        className="w-full py-4 bg-white text-black text-2xl font-semibold uppercase tracking-widest cursor-pointer border-none font-mono hover:text-pink-500 hover:bg-gray-900 transition-colors"
      >
        Reset Game
      </button>
    </div>
  )
}
