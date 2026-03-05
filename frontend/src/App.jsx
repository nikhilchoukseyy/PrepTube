import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VideoPage from './pages/VideoPage';
import ProfilePage from './pages/ProfilePage';
import AuthCallback from './pages/AuthCallback';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<HomePage/>}/>
        <Route path='/login' element={<LoginPage/>}/>
        <Route path='/register' element={<RegisterPage/>}/>
        <Route path='/video/:id' element={<VideoPage/>}/>
        <Route path='/profile' element={<ProfilePage/>}/>
        <Route path='/auth/callback' element={<AuthCallback/>}/>
      </Routes>
    </Router>
  );
}

export default App;