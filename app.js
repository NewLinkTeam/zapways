const express =require('express')


const routes = require('./routes/routes')
const app=express()

app.use(express.json())
app.use(express.urlencoded({ extended: true })); 

const port =3001

app.get('/',(req,res)=>{
    res.send('hello app.js')
})

app.use('/api',routes)


app.listen(port,()=>{
    console.log(`port is running on ${port}`)
})






