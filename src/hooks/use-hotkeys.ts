import { useEffect } from "react"

export function useHotkeys(
  key: string,
  options: { ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean },
  callback: () => void
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isKeyMatch = event.key.toLowerCase() === key.toLowerCase()

      const ctrlPressed = options.ctrl ? (event.ctrlKey || event.metaKey) : true
      const shiftPressed = options.shift ? event.shiftKey : true
      const altPressed = options.alt ? event.altKey : true

      if (isKeyMatch && ctrlPressed && shiftPressed && altPressed) {
        event.preventDefault()
        callback()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [key, options, callback])
}