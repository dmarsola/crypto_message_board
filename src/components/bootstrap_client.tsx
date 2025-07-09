'use client'

import { useEffect } from 'react'

export default function BootstrapInitializer() {
  useEffect(() => {
    Promise.all([import('bootstrap/js/dist/tooltip'), import('bootstrap/js/dist/modal')]).then(([{ default: Tooltip }, { default: Modal }]) => {
      document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => new Tooltip(el))
      document.querySelectorAll('.modal').forEach((el) => new Modal(el))
    })
  }, [])

  return null
}

// 'use client'

// import { useEffect } from 'react'

// export default function BootstrapClient() {
//   useEffect(() => {
//     import('bootstrap')
//   }, [])

//   return null
// }
