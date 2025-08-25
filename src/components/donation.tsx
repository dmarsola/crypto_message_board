import React from 'react'

export default function Donation() {
  return (
    <div
      style={{
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
        width: '259px',
        background: '#FFFFFF',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        boxShadow: '-2px 10px 5px rgba(0, 0, 0, 0)',
        borderRadius: '10px',
        fontFamily: 'SQ Market, Helvetica, Arial, sans-serif',
      }}
    >
      <div style={{ padding: '20px' }}>
        <p
          style={{
            fontSize: '18px',
            lineHeight: '20px',
            fontWeight: 600,
          }}
        >
          $5.00
        </p>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://square.link/u/n6T1N7Y7?src=embed"
          data-url="https://square.link/u/n6T1N7Y7?src=embd"
          style={{
            display: 'inline-block',
            fontSize: '18px',
            lineHeight: '48px',
            height: '48px',
            color: '#ffffff',
            minWidth: '212px',
            backgroundColor: '#006aff',
            textAlign: 'center',
            boxShadow: '0 0 0 1px rgba(0,0,0,.1) inset',
            borderRadius: '6px',
            textDecoration: 'none',
            padding: '0 16px',
          }}
        >
          Pay now
        </a>
      </div>
    </div>
  )
}
