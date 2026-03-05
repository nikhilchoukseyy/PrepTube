import mongoose from "mongoose";
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  googleId: { type: String },
  avatar: { type: String },
  role: { type: String, default: "user" },
  playlists: [{ type: mongoose.Schema.Types.ObjectId, ref: "Playlist" }],
},
  { timestamps: true }
);

userSchema.pre("save", async function (next){
  if (!this.isModified("password")){
    return next(); 
  }
  const salt = await bcrypt.genSalt(10); 
  this.password = await bcrypt.hash(this.password,salt); 
  next(); 
})

userSchema.methods.matchPassword = async function (enteredPass){
  return await bcrypt.compare(enteredPass,this.password); 
}

const User = mongoose.model("User", userSchema);
export default User; 