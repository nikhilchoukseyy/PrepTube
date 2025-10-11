import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
  videoId:{type:String,required:true}, 
  title:{type:String}, 
  duration:{type:Number}
})

const progressSchema = new mongoose.Schema({
  user : {type:mongoose.Schema.Types.ObjectId , ref:'User' , required:true}, 
  completedVideos : [{type: String}]
})

const inviteTokenSchema = new mongoose.Schema({
  token : {type:String,required:true}, 
  createdAt : {type:Date , default:Date.now}
})

const playlistSchema = new mongoose.Schema({
  title : {type:String , required: true}, 
  owner : {type:mongoose.Schema.Types.ObjectId,ref:"User",required:true}, 
  members : {type: mongoose.Schema.Types.ObjectId, ref:"User"}, 
  videos : [videoSchema], 
  progress : [progressSchema], 
  inviteTokens : [inviteTokenSchema]
})

const Playlist = mongoose.model("Playlist", playlistSchema);
export default Playlist;