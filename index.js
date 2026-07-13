const express = require('express');
const line = require('@line/bot-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const app = express();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  systemInstruction: "คุณคือ 'หมอบอท' ผู้เชี่ยวชาญด้านการให้คำแนะนำและบำบัดอาการ Office Syndrome เช่น ปวดหลัง ปวดบ่า ปวดข้อมือ ตาแห้ง ให้ตอบคำถามด้วยความเป็นกันเอง สนุกสนาน ใส่ใจ และให้คำแนะนำท่ายืดเหยียดหรือการปรับพฤติกรรมที่ถูกต้อง กระชับ เข้าใจง่าย",
});

app.get('/', (req, res) => {
  res.send('LINE Bot with Gemini & Supabase is running!');
});

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userId = event.source.userId;
  const userMessage = event.message.text;

  try {
    let { data: account, error } = await supabase
      .from('conversations')
      .select('history')
      .eq('user_id', userId)
      .single();

    let history = [];
    if (account && account.history) {
      history = account.history;
    }

    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }))
    });

    const result = await chat.sendMessage(userMessage);
    const botReply = result.response.text();

    history.push({ role: 'user', text: userMessage });
    history.push({ role: 'model', text: botReply });

    if (history.length > 20) {
      history = history.slice(-20);
    }

    await supabase.from('conversations').upsert({
      user_id: userId,
      history: history,
      updated_at: new Date().toISOString()
    });

    const client = new line.messagingApi.MessagingApiClient({
      channelAccessToken: config.channelAccessToken
    });

    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: 'text', text: botReply }],
    });

  } catch (err) {
    console.error('Error handling event:', err);
    
    const client = new line.messagingApi.MessagingApiClient({
      channelAccessToken: config.channelAccessToken
    });
    
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: 'text', text: 'ขออภัยด้วยครับบอส เกิดอาการมึนหัวนิดหน่อย ลองพิมพ์ใหม่อีกทีนะครับ!' }],
    });
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
