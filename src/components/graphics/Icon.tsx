'use client'
import React from 'react'

const Icon: React.FC = () => {
  return (
    <div className="icon">
      <svg 
        width="32" 
        height="32" 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Custom icon - replace with your actual icon */}
        <circle cx="16" cy="16" r="14" fill="currentColor" fillOpacity="0.1"/>
        <circle cx="16" cy="16" r="6" fill="currentColor"/>
        <circle cx="16" cy="16" r="2" fill="white"/>
      </svg>
    </div>
  )
}

export { Icon }
export default Icon