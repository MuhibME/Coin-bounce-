const Joi = require('joi');
const fs = require('fs');
const Blog = require('../models/blog.js')
const {BACKEND_SERVER_PATH} = require('../config/index.js')
const mongodbIdPattern = /^[0-9a-fA-F]{24}$/;
const BlogDTO = require('../dto/blog.js');
const BlogDetailsDTO =require('../dto/blog-details.js');
const { mongo } = require('mongoose');
const Comment = require('../models/comment.js') 

const blogController = {
    async create(req,res,next){
        //validate req body
        //handle photo storage, naming
        //add to db
        //return response

        //image form client side encoded in string -> decode -> store -> save image path in db
        const createBlogSchema = Joi.object({
            title: Joi.string().required(),
            author:Joi.string().required().regex(mongodbIdPattern),
            content:Joi.string().required(),
            photo:Joi.string().required(),
        });
        const {error} = createBlogSchema.validate(req.body);

        if(error){
            return next(error);
        }

        const {title,author,content,photo} = req.body;

        //photo handling
        //read as buffer
        const buffer = Buffer.from(photo.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""),'base64')
        //allot a random name
        const imagePath = `${Date.now()}-${author}.png`;
        //save locally usinf fs built in node 
        let newBlog;
        try{
            fs.writeFileSync(`storage/${imagePath}`,buffer);
        }catch(error){
            return next(error);
        }
        //save blog on db
        try{
            const newBlog = new Blog({
                title,
                author,
                content,
                photoPath: `${BACKEND_SERVER_PATH}/Storage/${imagePath}`,
            });
            await newBlog.save();
        }catch(error){return next(error);}
        const blogDTO = new BlogDTO(newBlog);
        return res.status(201).json({blog: blogDTO});
    },
    async getAll(req,res,next){
        try{
            //empty filter to retrive all
            const blogs = await Blog.find({});
            const blogsDTO = [];
            for(let i = 0; i < blogs.length; i++){
                const dto = new BlogDTO(blogs[i]);
                blogsDTO.push(dto);
            }
            return res.status(200).json({blogs: blogsDTO});
        }catch(error){
            return next(error);
        }
    },
    async getById(req,res,next){
        //validate id
        //response

        const getByIdSchema = Joi.object({
            id: Joi.string().regex(mongodbIdPattern).required()
        });
        const {error} = getByIdSchema.validate(req.params);
        if(error){
            return next(error);
        }
        let blog;
        const {id} = req.params;
        try{
            blog = await Blog.findOne({_id: id}).populate('author');
        }catch(error){
            return next(error);
        }
        const blogDetailsDTO = BlogDetailsDTO(blog);
        return res.status(200).json({blog: blogDetailsDTO});
    },
    async update(req,res,next){
        //validate
        //if phot update delete old one than add 
        //response

        const updateBlogSchema = Joi.object({
            title: Joi.string().required(),
            content: Joi.string().required(),
            author: Joi.String().regex(mongodbIdPattern).required(),
            blogId: Joi.string().regex(mongodbIdPattern).required(),
            photo: Joi.string(),
        });

        const{error} = updateBlogSchema.validate(req.body);
        const {title, content, author,blogId, photo} = req.body;

        //delete previous photo
        //save new photo
        let blog;
        try{
            blog = await Blog.findOne({_id: blogId});
        }catch(error){
            return next(error);
        }

        if(photo){
            previousPhoto = blog.photoPath;
            previousPhoto = previousPhoto.split('/').at(-1);//acces filename
            //delete
            fs.unlinkSync(`storage/${previousPhoto}`);

            //new 
            //read as buffer
            const buffer = Buffer.from(photo.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""),'base64')
            //allot a random name
            const imagePath = `${Date.now()}-${author}.png`;
            //save locally usinf fs built in node 
            let newBlog;
            try{
                fs.writeFileSync(`storage/${imagePath}`,buffer);
            }catch(error){
                return next(error);
            }
            //update on db
            await Blog.updateOne({_id: blogId}, {title,content,photoPath:`${BACKEND_SERVER_PATH}/storage/${imagePath}`});

        }else{
            await Blog.updateOne(
               {_id:blogId},{title,content} 
            );
        }
        return res.status(200).json({message: 'Blog Updated!'})
         

    },
    async delete(req,res,next){
        const deleteBlogSchema = Joi.object({
            id: Joi.string().required().regex(mongodbIdPattern)
        });
        
        const {error} = deleteBlogSchema.validate(req.body);

        const {id} = req.params;

        //delete blog
        //delete comments
        try{
            await Blog.deleteOne({_id: id});
            await Comment.deleteMany({blog: id});
        }catch(error){
            return next(error);
        }
        res.status(200).json({messgae: 'Blog Deleted'})
    },

}

module.exports = blogController;