import React, { useState } from 'react'
import { motion, HTMLMotionProps } from 'motion/react'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

export function ImageWithFallback(props: HTMLMotionProps<"img">) {
  const [didError, setDidError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setDidError(true)
    if (props.onError) props.onError(e)
  }

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true)
    if (props.onLoad) props.onLoad(e)
  }

  const { src, alt, style, className, ...rest } = props

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-800 ${className ?? ''}`}
      style={style as React.CSSProperties}
    >
      {!isLoaded && !didError && (
        <motion.div
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ repeat: Infinity, duration: 1, repeatType: 'reverse' }}
          className="absolute inset-0 bg-gray-200 dark:bg-gray-700"
        />
      )}
      
      {didError ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center w-full h-full p-2"
        >
          <img src={ERROR_IMG_SRC} alt="Error loading image" {...(rest as any)} data-original-url={src} className="w-10 h-10 opacity-30 dark:opacity-20" />
        </motion.div>
      ) : (
        <motion.img
          src={src}
          alt={alt}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full object-cover"
          {...rest}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  )
}
