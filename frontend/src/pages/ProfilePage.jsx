import React from 'react'

const ProfilePage = () => {
  const email = "test@example.com";
  return (
    <div>
      <h2>Profile</h2>
      <p>Email: {email}</p>
      <button onClick={() => localStorage.removeItem('token')}>Logout</button>
    </div>
  )
}

export default ProfilePage
