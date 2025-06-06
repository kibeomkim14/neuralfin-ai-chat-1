"use client"

import "./SuggestionCards.scss"

interface SuggestionCardsProps {
  suggestions: string[]
  onSuggestionClick: (suggestion: string) => void
}

const SuggestionCards = ({ suggestions, onSuggestionClick }: SuggestionCardsProps) => {
  return (
    <div className="suggestion-cards">
      {suggestions.map((suggestion, index) => (
        <div key={index} className="suggestion-card" onClick={() => onSuggestionClick(suggestion)}>
          {suggestion}
        </div>
      ))}
    </div>
  )
}

export default SuggestionCards
