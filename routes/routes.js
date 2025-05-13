
const express= require('express')
const router= express.Router()

const searchController= require('../controllers/searchcontroller')

router.post('/searchlowfare',searchController.index)


module.exports=router