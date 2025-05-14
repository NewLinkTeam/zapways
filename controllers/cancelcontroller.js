const self={
    index:async(req,res)=>{
        console.log('request=>',req.body)
        console.log('salaam Asad Shahi')


        res.json({
            success:true,
            message:'Flight cancelled successfully'
        })
    }
}
module.exports=self
