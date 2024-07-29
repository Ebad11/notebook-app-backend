const express= require('express');
const fetchuser = require('../middleware/fetchuser');
const Notes = require('../models/Notes');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const router= express.Router();


// Route 1: Fetch Note
router.get('/fetchnotes',fetchuser, async (req,res)=>{

     try {
          const notes= await Notes.find({user:req.user.id});
          res.json(notes);
          
     }  catch (error) {
          console.error(error.message);
          res.status(500).send("Internal server Error")
     }
});


//Route 2: Add a Note

router.post('/addnote',fetchuser, [
     //Validators
     body('title', 'Title should be longer than 3 characters').isLength({ min: 3 }),
     body('description', 'Description should be longer than 5 characters').isLength({ min: 5 }),
],
async (req,res)=>{

    const result = validationResult(req);
    if (!result.isEmpty()) {
         return res.status(400).json({ error: result.array() });
    }


    try {
     const {title, description, tag}= req.body;

     const note= new Notes(
          {
               title:title,
               description:description,
               user:req.user.id,
               tag:tag
          }
     )

     const savedNote= await note.save();

     res.send(savedNote);
    } catch (error) {
     console.error(error.message);
     res.status(500).send("Internal server Error")
}
});


// Route 3: Update an existing note Note
router.put('/updatenote/:id',fetchuser, async (req,res)=>{

     //Destructuring content send for updation  by user
     const {title, description, tag}= req.body;
     try {
          const newNote= {};
          // Create object of elements to be updated
          if(title) newNote.title= title;
          if(description) newNote.description= description;
          if(tag) newNote.tag= tag;
     
          //Note by id sent in the parameter xists or not
          let note= await Notes.findById(req.params.id);
          if(!note)
          {
               return res.status(404).send("Not found")
          }
     
          // Note exists but does it belong to this user
     
          //Note found doesnot match the id of authtoken
           if(note.user.toString() != req.user.id)
           {
               return res.status(404).send("Not allowed")
           }
     
           //Update note
           note = await Notes.findByIdAndUpdate(req.params.id, {$set: newNote}, {new:true})
           res.json({note})
          
     } catch (error) {
          console.error(error.message);
          res.status(500).send("Internal server Error")
     }
})


// Route 4: Delete an existing note Note
router.delete('/deletenote/:id',fetchuser, async (req,res)=>{

     try {
          
          //Note by id sent in the parameter exists or not
          let note= await Notes.findById(req.params.id);
          if(!note)
          {
               return res.status(404).send("Not found")
          }
     
          // Note exists but does it belong to this user
     
               //Note found doesnot match the id of authtoken
               if(note.user.toString() != req.user.id)
               {
                    return res.status(404).send("Not allowed")
               }
     
          //Delete   note
          note = await Notes.findByIdAndDelete(req.params.id)
          res.json({'Success':"Note has been deleted", note: note});
     } catch (error) {
          console.error(error.message);
          res.status(500).send("Internal server Error")
     }
})
module.exports= router