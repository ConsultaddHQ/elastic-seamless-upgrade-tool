
// import './App.css'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Pages from './pages'

function App() {
  

  return (
    <>
      <div className="flex flex-row">
        <Sidebar />
        <div className='w-full'>
            <Navbar />
            <Pages />
        </div>
      </div>
    </>
  )
}

export default App
