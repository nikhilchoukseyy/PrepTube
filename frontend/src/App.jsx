import { useState } from 'react'
import './App.css'
import {HomePage} from './pages/HomePage'
import {LoginPage} from './pages/loginPage'
import {RegisterPage} from './pages/RegisterPage'
import {VideoPage} from './pages/VideoPage'
import {ProfilePage} from './pages/ProfilePage'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path='/' element={<HomePage/>}/>
      <Route path='/login' element={<LoginPage/>}/>
      <Route path='/register' element={<RegisterPage/>}/>
      <Route path='/video/:id' element={<VideoPage/>}/>
      <Route path='/profile' element={<ProfilePage/>}/>
    </Routes>
  );
}

export default App
