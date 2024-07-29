const mongoose = require('mongoose');
const mongoURI = "mongodb+srv://ebad_shk_11:ebad011@cluster0.x2jpttr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"


function connectToMongo() {
  mongoose.connect(mongoURI)
  .then(() => {
     console.log("Connected")
  }).catch((err) => {
    console.log("Error")
  });

}

module.exports = connectToMongo;