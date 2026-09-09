import { useEffect, useState } from "react"
import { type MainnetToken } from "@/lib/robinhood-chain"

type TokenAvatarProps = {
  token: MainnetToken
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "h-5 w-5 text-[8px]",
  md: "h-8 w-8 text-[11px]",
  lg: "h-10 w-10 text-sm",
} as const

function fallbackStyle(token: MainnetToken) {
  if (token.category === "etf") return "bg-violet-500/15 text-violet-700 ring-violet-500/20 dark:text-violet-200"
  if (token.category === "stock") return "bg-sky-500/15 text-sky-700 ring-sky-500/20 dark:text-sky-200"
  if (token.symbol === "ETH" || token.symbol === "WETH") return "bg-indigo-500/15 text-indigo-700 ring-indigo-500/20 dark:text-indigo-200"
  if (token.symbol === "LINK") return "bg-blue-500/15 text-blue-700 ring-blue-500/20 dark:text-blue-200"
  return "bg-emerald-500/15 text-emerald-700 ring-emerald-500/20 dark:text-emerald-200"
}

export function TokenAvatar({ token, size = "md", className = "" }: TokenAvatarProps) {
  const [hasImageError, setHasImageError] = useState(false)

  useEffect(() => {
    setHasImageError(false)
  }, [token.logoUrl])

  const initials = token.symbol.slice(0, 2).toUpperCase()

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-inset ${sizeClasses[size]} ${hasImageError || !token.logoUrl ? fallbackStyle(token) : "bg-background"} ${className}`}
      aria-label={`${token.symbol} logo`}
    >
      {token.logoUrl && !hasImageError ? (
        <img
          src={token.logoUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setHasImageError(true)}
        />
      ) : (
        <span className="font-bold leading-none">{initials}</span>
      )}
    </span>
  )
}