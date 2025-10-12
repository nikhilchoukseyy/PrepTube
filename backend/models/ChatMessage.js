import mongoose from 'mongoose'

const chatSchema = new mongoose.Schema({
  playlist:{required:true , type:mongoose.Schema.Types.ObjectId,ref:"Playlist"},
  sender:{type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message:{type:String,required:true}
},{timestamps:true})

const ChatMessage =  mongoose.model("ChatMessage",chatSchema); 
export default ChatMessage ; 