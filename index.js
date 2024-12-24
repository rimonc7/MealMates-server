const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();






app.get('/',(req,res)=>{
    res.send('MealMates Server is Running')
})

app.listen(port,()=>{
    console.log(`MealMates Server Running on Port ${port}`)
})