import Nav from './nav'

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Nav />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}

export default Layout
