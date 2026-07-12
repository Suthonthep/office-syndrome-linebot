const express = require('express');
const line = require('@line/bot-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');

// 1. ตั้งค่า LINE Bot
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};
const client = new line.Client(config);

// 2. ตั้งค่า Supabase (ดึงค่าจาก Env ที่บอสกรอกตะกี้)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 3. ตั้งค่า Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  // กำหนดบทบาทให้ Gemini เป็นผู้เชี่ยวชาญด้านออฟฟิศซินโดรม
  systemInstruction: "คุณคือ 'หมอบอท' ผู้เชี่ยวชาญด้านกายภาพบำบัด สรีรศาสตร์ และการรักษาป้องกันโรคออฟฟิศซินโดรม (Office Syndrome) ให้คำแนะนำอย่างเป็นกันเอง สุภาพ เข้าใจง่าย มีอารมณ์ขันเล็กน้อย และตอบเป็นภาษาไทยเสมอ แนะนำท่าทางยืดเหยียดที่ถูกต้องเมื่อผู้ใช้บ่นว่าปวดเมื่อย"
});

const app = express();

// หน้าแรกเอาไว้เช็คว่าบอทรันได้ปกติไหม
app.get('/', (req, res) => {
  res.send('Office Syndrome LINE Bot is running perfectly!');
});

// เส้นทางสำหรับรับ Webhook จาก LINE
app.post('/webhook', line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error("Webhook Error: ", err);
      res.status(500).end();
    });
});

// ฟังก์ชันหลักในการจัดการข้อความ
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return null;
  }

  const userId = event.source.userId;
  const userMessage = event.message.text;

  try {
    // 🔍 สเตปที่ 1: ดึงประวัติการคุยเก่าของ User คนนี้จาก Supabase
    let { data: conversation, error } = await supabase
      .from('conversations')
      .select('history')
      .eq('user_id', userId)
      .single();

    let chatHistory = [];
    if (conversation && conversation.history) {
      chatHistory = conversation.history;
    }

    // 🧠 สเตปที่ 2: ส่งประวัติเก่า + ข้อความใหม่ไปให้ Gemini คิดคำตอบ
    const chat = model.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessage(userMessage);
    const replyText = result.response.text();

    // 💾 สเตปที่ 3: อัปเดตประวัติการคุยใหม่ (จำข้อความล่าสุดของ User และบอท)
    // เก็บประวัติย้อนหลังสูงสุด 20 ข้อความเพื่อไม่ให้ข้อมูลบวมเกินไป
    const updatedHistory = [
      ...chatHistory,
      { role: 'user', parts: [{ text: userMessage }] },
      { role: 'model', parts: [{ text: replyText }] }
    ].slice(-20);

    // บันทึกลง Supabase (ถ้ายังไม่มีข้อมูลจะสร้างใหม่ ถ้ามีแล้วจะอัปเดตทับ)
    await supabase
      .from('conversations')
      .upsert({ 
        user_id: userId, 
        history: updatedHistory,
        updated_at: new Date()
      });

    // 💬 สเตปที่ 4: ส่งข้อความตอบกลับไปหาผู้ใช้ใน LINE
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: replyText
    });

  } catch (error) {
    console.error("Error in AI or Database processing: ", error);
    // กรณีระบบขัดข้อง ให้บอทตอบข้อความเซฟตัวเองไว้ก่อน
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: "อุ๊ย! สมองเบลอไปนิดนึง บอสลองพิมพ์คุยกับผมใหม่อีกทีนะครับ หรือลองลุกขึ้นบิดขี้เกียจสัก 10 วินาทีก่อนนะฮะ!"
    });
  }
}

// เปิดพอร์ตสำหรับรอรับ Request จาก Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});