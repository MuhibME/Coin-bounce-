const Joi = require('joi');
const mongodbIdPattern = /^[0-9a-fA-F]{24}$/;
const commentModal = require('../models/comment');
const commentDTO = require('../dto/comment');
const CommentDTO = require('../dto/comment');


const commentController = {
    async create(req,res,next){
        const createCommentSchema = Joi.object({
            content: Joi.string().required(),
            author: Joi.string().required().regex(mongodbIdPattern),
            blog: Joi.string().required().regex(mongodbIdPattern),
        });
        const {error} = createCommentSchema.validate(req.body);
        if (error){return next(error);}
        
        const {content,author,blog} = req.body;

        try{
            const newComent = new commentModal({
                content,author,blog
            }) ;
        }catch(error){
            return next(error);
        }
        return res.status(201).json({message: 'Comment Created'});
    },
    async getById(req,res,next){
        const getByIdSchema = Joi.object({
            id: Joi.string().regex(mongodbIdPattern).required()
        });
        const {error} = this.getByIdSchema.validate(req.params);
        if(error){
            return next(error);
        }
        const {id} = req.params;
        let comments;
        try{
            comments = await commentModal.find({blog:id}).populate('author');
        }catch(error){return next(error);}
        let commentsDTO = [];
        for(let i = 0 ; i < comments.length; i++ ){
            const obj = new CommentDTO(comments[i]);
            commentsDTO.push(obj);
        }
        return res.status(200).json({data: commentsDTO});
    }
}