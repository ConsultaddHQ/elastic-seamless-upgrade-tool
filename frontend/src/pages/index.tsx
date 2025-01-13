
import { Routes  ,Route} from 'react-router-dom'
import Home from './Home'
import Assist from './assist';

function Pages() {
  return (
    <Routes >
      <Route path='/' element={<Home />} />
      <Route path='/assist' element={<Assist />} />
    {/* <Route path="/course" element={<Courses />} />
    <Route path="/live" element={<Live />} />
    <Route path="/contact" element={<Contact />} /> */}
    </Routes>
  )
}

export default Pages;