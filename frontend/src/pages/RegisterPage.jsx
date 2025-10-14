import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    try {
      const res = await axios.post('http://localhost:8000/api/users/register', { name, email, password });
      localStorage.setItem('token', res.data.token)
      navigate('/HomePage')
    } catch (error) {
      console.log(error.response.data.message);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Register page</h1>
      <input type="text" placeholder='Name' value={name} onChange={e=>setName(e.target.value)}/>
      <input type="email" placeholder='Email' value={email} onChange={e=>setEmail(e.target.value)}/>
      <input type="password" placeholder='Password' value={password} onChange={e=>setPassword(e.target.value)}/>
      <button type='submit'>Register</button>
    </form>
  )
}

export default RegisterPage
