const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3000;
const RESULTS = path.join(__dirname, 'results.json');
app.use(express.json({limit:'20kb'}));
app.use(express.static(__dirname));
function safe(v,max=100){return String(v??'').trim().slice(0,max)}
app.post('/api/results', async (req,res)=>{
  const {firstName,lastName,score,total,percent,answers}=req.body||{};
  if(!safe(firstName,40)||!safe(lastName,50)||!Number.isInteger(score)||!Number.isInteger(total)) return res.status(400).json({ok:false,error:'Некорректные данные'});
  const item={id:Date.now(),date:new Date().toISOString(),firstName:safe(firstName,40),lastName:safe(lastName,50),score,total,percent,answers:Array.isArray(answers)?answers:[]};
  let all=[]; try{all=JSON.parse(fs.readFileSync(RESULTS,'utf8'))}catch{}
  all.push(item); fs.writeFileSync(RESULTS,JSON.stringify(all,null,2));
  // Optional Telegram notification. Fill TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env.
  if(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID){
    const text=`Новый результат по географии\n${item.firstName} ${item.lastName}\nОценка: ${item.score}/${item.total} (${item.percent}%)`;
    try{await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:process.env.TELEGRAM_CHAT_ID,text})})}catch(e){console.error('Telegram error:',e.message)}
  }
  res.json({ok:true});
});
app.get('/api/results',(req,res)=>{ // For owner/local server use only; protect this route before public deployment.
  try{res.json(JSON.parse(fs.readFileSync(RESULTS,'utf8')))}catch{res.json([])}
});
app.listen(PORT,()=>console.log(`Quiz running: http://localhost:${PORT}`));
