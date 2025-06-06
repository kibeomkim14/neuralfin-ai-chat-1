import "./Header.scss"

const Header = () => {
  return (
    <header className="header">
      <div className="logo">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DL_Design_Page__Qraft_Internal_-Ki8TVUwYNuY2K11LmLYZhddqonMiFD.png"
          alt="NEURALFIN.AI"
          className="logo-image"
        />
      </div>
      <div className="user-profile">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DL_Design_Page__Qraft_Internal_-sVQ51sIbQ0FEksQdMoxd90Rf34oT2c.png"
          alt="User Profile"
          className="user-avatar"
        />
      </div>
    </header>
  )
}

export default Header
