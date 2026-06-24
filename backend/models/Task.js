import mongoose from "mongoose";


const taskSchema = new mongoose.Schema(
{
  title:{
    type:String,
    required:true,
    trim:true
  },


  description:{
    type:String,
    default:""
  },


  assignedTo:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  },


  leadId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Lead",
    default:null
  },


  priority:{
    type:String,
    enum:[
      "Low",
      "Medium",
      "High"
    ],
    default:"Medium"
  },


  status:{
    type:String,
    enum:[
      "Pending",
      "In Progress",
      "Completed"
    ],
    default:"Pending"
  },


  dueDate:{
    type:Date
  },


  createdBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
  }


},
{
 timestamps:true
});


const Task = mongoose.model(
  "Task",
  taskSchema
);


export default Task;