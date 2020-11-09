let logTime =(req,res,next)=>{
    let key=req.originalUrl||req.url;
    console.time(key);
    next();
}
let printTime =(url)=>{
    let key=url;
    console.timeEnd(key);
}

export{
    logTime,
    printTime
}