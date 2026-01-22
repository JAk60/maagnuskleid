"use client"

import { useTheme } from "@/context/theme-context"
import { motion } from "framer-motion"
import { Sun, Moon } from "lucide-react"

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="w-8 md:w-12 h-8 md:h-12 rounded-full flex justify-center items-center hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer relative transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Sun className="text-[19px] md:text-[24px] text-yellow-500" size={20} />
      ) : (
        <Moon className="text-[19px] md:text-[24px] text-blue-400" size={20} />
      )}
    </motion.button>
  )
}