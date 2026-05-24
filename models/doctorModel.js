const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const slotSchema = new mongoose.Schema(
{
  start: { type:String, required:true },
  end: { type:String, required:true },

  maxPatients: {
    type: Number,
    default: 1
  }
},
{ _id:false }
);

const doctorSchema = new mongoose.Schema({

name:{
type:String,
required:true,
trim:true
},

email:{
type:String,
required:true,
unique:true,
lowercase:true
},

password:{
type:String,
required:true
},

phone:{
type:String,
required:true
},

specialty:{
type:String,
required:true
},

gender:{
type:String,
enum:["male","female","other"],
required:true
},

about:{
type:String,
default:""
},

address:{
street:{
type:String,
default:""
},

area:{
type:String,
default:"",
index:true
},

city:{
type:String,
default:""
}
},

consultationFee:{
type:Number,
required:true
},

mode:{
type:String,
enum:["online","offline","both"],
required:true
},

photo:{
type:String,
default:""
},

availability:{
weekly:{
monday:[slotSchema],
tuesday:[slotSchema],
wednesday:[slotSchema],
thursday:[slotSchema],
friday:[slotSchema],
saturday:[slotSchema],
sunday:[slotSchema]
},

overrides:[
{
from:{type:Date,required:true},
to:{type:Date,required:true},
slots:[slotSchema]
}
]
},

rating:{
type:Number,
default:0,
min:0,
max:5
},

ratingCount:{
type:Number,
default:0
},

role:{
type:String,
default:"doctor",
immutable:true
},


verificationStatus: {
  type: String,
  enum: ["pending", "approved", "rejected"],
  default: "otp_pending"
},

verificationDetails: {
  registrationNumber: String,
  councilName: String,
  degree: String
}

},{timestamps:true});

/* PASSWORD HASH */
doctorSchema.pre("save",async function(){

if(!this.isModified("password")) return;

this.password = await bcrypt.hash(this.password,10);

});

module.exports = mongoose.model("Doctor",doctorSchema);
