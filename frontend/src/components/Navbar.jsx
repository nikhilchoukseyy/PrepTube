import React from 'react'

const Navbar = () => {
  return (
    <nav className='bg-black min-w-screen flex justify-between text-white px-2 py-1'>
      <div className='logo'>logo</div>
      <div className='searchbar'><input type="text" placeholder='Search here'/></div>
      <div className='login-register'><button>login/register</button></div>
    </nav>
  )
}

export default Navbar
