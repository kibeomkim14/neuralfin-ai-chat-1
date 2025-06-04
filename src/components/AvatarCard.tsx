"use client"

import "./AvatarCard.scss"

interface AvatarCardProps {
  onToggleAvatar: () => void
}

const AvatarCard = ({ onToggleAvatar }: AvatarCardProps) => {
  const BackArrowIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )

  const EyeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  )

  return (
    <div className="avatar-card">
      <div className="avatar-card-header">
        <button className="back-button">
          <BackArrowIcon />
        </button>
        <button className="toggle-avatar-button" onClick={onToggleAvatar}>
          Hide Avatar <EyeIcon />
        </button>
      </div>

      <div className="avatar-background"></div>

      <div className="avatar-info">
        <h2 className="avatar-name">Sandra</h2>
        <p className="avatar-title">DL Family Office</p>
      </div>
    </div>
  )
}

export default AvatarCard
