'use client'
import React from 'react'

const Logo: React.FC = () => {
  return (
    <div className="logo">
      <svg 
        width="150" 
        height="40" 
        viewBox="0 0 150 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Custom logo - replace with your actual logo */}
        <rect width="150" height="40" rx="8" fill="currentColor" fillOpacity="0.1"/>
        <text 
          x="75" 
          y="24" 
          textAnchor="middle" 
          fontSize="16" 
          fontWeight="600" 
          fill="currentColor"
        >
          {process.env.SITE_NAME || 'DiscoverXYZ'}
        </text>
      </svg>
    </div>
  )
}

export { Logo }
export default Logo