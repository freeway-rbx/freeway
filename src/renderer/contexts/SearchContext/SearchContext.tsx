import {createContext, useContext, useState} from 'react'

interface SearchContextType {
  query: string
  setQuery: (value: string) => void
  clear: () => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export function SearchProvider({children}: {children: React.ReactNode}) {
  const [query, setQuery] = useState('')

  const clear = () => setQuery('')

  return (
    <SearchContext.Provider value={{query, setQuery, clear}}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (!context)
    throw new Error('useSearch must be used within a SearchProvider')
  return context
}
