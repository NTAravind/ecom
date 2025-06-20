'use client'

import { createContext, ReactNode, useState } from "react"

export const CountContext = createContext<any>(1)
export function CountProvider({children}:{children:ReactNode}){
const [count,SetCount] = useState(1)
return(
  <CountContext.Provider value={{count,SetCount}}>
    {children}
  </CountContext.Provider>
)
}