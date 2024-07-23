const mongoose = require('mongoose');

const {Schema} = mongoose;


const commentSchema = new Schema({
    author: {type:String, required:true},
    blog: {type: mongoose.SchemaTypes.ObjectId, ref:'Blog'},
    content: {type:mongoose.SchemaTypes.ObjectId, ref:'User'},
   
},
{
    timestamps:true
}
);

module.exports = mongoose.model('Comment',commentSchema,'comments');