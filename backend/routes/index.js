const express = require('express');
const router = express.Router();
const authController = require('../controller/authController.js');
const auth = require('../middleware/auth.js')
const blogController = require('../controller/blogController.js');
const commentController = require('../controller/commentController.js');


//Testing Endpoints
router.get('/test', (req, res)=> {res.json({msg : 'Working!'})} )


/// user routes / endpoints
    
//login

router.post('/login',authController.login)

//register
router.post('/register', authController.register);

//logout
router.post('/logout',auth, authController.logout);

//refresh 
router.get('/refresh',authController.refresh);


///Blogs

//create and protected route behind login
router.post('/blog',auth,blogController.create);

//get all blogs protected route
router.get('/blog/all', auth , blogController.getAll);

//get blog by id 
router.get('/blog/:id',auth,blogController.getById);

//update
router.put('/blog',auth,blogController.update);

//delete
router.delete('/blog/:id',auth,blogController.delete)


///comments
//create
router.post('/comment',commentController.create);

//get comments on blog
router.get('/comment/:id',commentController.getById)

module.exports = router;