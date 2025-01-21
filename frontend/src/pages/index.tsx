
import { Routes  ,Route} from 'react-router-dom'
import Home from './Home'
import Assist from './assist';
import ClusterOverview from './cluster';
import NodeInfo from './nodes';

function Pages() {
  return (
    <Routes >
      <Route path='/' element={<ClusterOverview/>} />
      <Route path='/assist' element={<Assist />} />
      <Route path='/assist/node/info' element={<NodeInfo />} />
    {/* <Route path="/course" element={<Courses />} />
    <Route path="/live" element={<Live />} />
    <Route path="/contact" element={<Contact />} /> */}
    </Routes>
  )
}

export default Pages;