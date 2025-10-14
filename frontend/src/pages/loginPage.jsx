import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'


const loginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:8000/api/users/login", { email, password });
      localStorage.setItem("token", res.data.token);
      navigate('/HomePage');
    } catch (error) {
      console.log(error.response.data.message);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>loginPage</h1>
      <input type="email" value={email} placeholder='enter email...' onChange={e => setEmail(e.target.value)} />
      <input type="password" value={password} id="" placeholder='enter password...' onChange={e => setPassword(e.target.value)} />
      <button type="submit">login</button>
    </form>
  )
}

export default loginPage
