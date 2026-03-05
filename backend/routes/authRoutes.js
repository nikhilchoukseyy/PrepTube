import express from 'express'
import passport from '../config/passport.js';
import jwt from 'jsonwebtoken';
import {protect} from '../middleware/authMiddleware.js'

const router = express.Router(); 


router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    
    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Send token to frontend via URL param
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?token=${token}&name=${encodeURIComponent(req.user.name)}&email=${encodeURIComponent(req.user.email)}&id=${req.user._id}`
    );
  }
);

router.get('/protected',protect,(req,res)=>{
  res.json({message: "Access granted", user: req.user}); 
})

export default router ;