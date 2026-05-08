import { useEffect, useRef, useState } from 'react'

export interface ActionMenuItem {
  label: string
  onClick: () => void
  tone?: 'danger' | 'default'
}

export interface ActionMenuProps {
  items: ActionMenuItem[]
  /** aria-label for the trigger button. Default: "Más opciones" */
  triggerLabel?: string
}

export default function ActionMenu({
  items,
  triggerLabel = 'Más opciones',
}: ActionMenuProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)

  // Close when clicking outside the component
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Move DOM focus to the currently focused menu item
  useEffect(() => {
    if (!open || focusedIndex < 0) return
    const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]')
    items?.[focusedIndex]?.focus()
  }, [focusedIndex, open])

  function handleTriggerClick() {
    setOpen((prev) => !prev)
    setFocusedIndex(0)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex((prev) => (prev + 1) % items.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex((prev) => (prev - 1 + items.length) % items.length)
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
        break
    }
  }

  function handleItemClick(item: ActionMenuItem) {
    setOpen(false)
    triggerRef.current?.focus()
    item.onClick()
  }

  return (
    <div className="relative" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleTriggerClick}
        className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        {/* Three vertical dots — Unicode VERTICAL ELLIPSIS */}
        ⋮
      </button>

      {open && (
        <ul
          ref={menuRef}
          role="menu"
          className="absolute right-0 z-20 mt-1 min-w-[10rem] rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {items.map((item, index) => (
            <li key={item.label} role="none">
              <button
                role="menuitem"
                type="button"
                tabIndex={-1}
                onClick={() => handleItemClick(item)}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                  item.tone === 'danger'
                    ? 'text-accent-600'
                    : 'text-foreground'
                } ${focusedIndex === index ? 'bg-gray-50' : ''}`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
