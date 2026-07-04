const express = require('express');
const line = require('@line/bot-sdk');

// 1. ตั้งค่าคอนฟิกของ LINE (ระบบจะดึงค่าจาก Environment Variables ใน Render อัตโนมัติ)
const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET
};

const client = new line.Client(config);
const app = express();

// 2. หน้าแรกของเซิร์ฟเวอร์ (เช็คสถานะระบบ)
app.get('/', (req, res) => {
    res.send('Office Syndrome LINE Bot is running perfectly!');
});

// 3. เส้นทาง Webhook สำหรับรับข้อมูลจาก LINE
app.post('/callback', line.middleware(config), (req, res) => {
    Promise
        .all(req.body.events.map(handleEvent))
        .then((result) => res.json(result))
        .catch((err) => {
            console.error('Error handling events:', err);
            res.status(500).end();
        });
});

// 4. ฟังก์ชันหลักในการคิดและประมวลผลข้อความ (สมองสำหรับการแยกแยะอาการ)
function handleEvent(event) {
    if (event.type !== 'message' || event.message.type !== 'text') {
        return Promise.resolve(null);
    }

    const userText = event.message.text.trim().toLowerCase();

    // ระบบตรวจจับข้อความทักทาย / เริ่มต้น
    if (userText === 'เริ่มใช้งาน' || userText === 'สวัสดี' || userText === 'help') {
        return replyWelcome(event.replyToken);
    }

    // อาการที่ 1: คอ บ่า ไหล่
    if (/คอ|บ่า|ไหล่|ตึงคอ|สะบัก|จ้องคอม/g.test(userText)) {
        return replyNeckShoulder(event.replyToken);
    }

    // อาการที่ 2: หลัง / เอว
    if (/หลัง|เอว|ก้มไม่ได้|นั่งนาน/g.test(userText)) {
        return replyBackPain(event.replyToken);
    }

    // อาการที่ 3: ข้อมือ / มือชา
    if (/ข้อมือ|นิ้วล็อค|ชา|เมาส์|คลิก/g.test(userText)) {
        return replyWristPain(event.replyToken);
    }

    // กรณีบอทไม่แน่ใจ (Fallback) ให้ส่งข้อความแนะนำทั่วไปแบบคลีนๆ
    return client.replyMessage(event.replyToken, [
        {
            type: 'text',
            text: 'หมอ (และเพื่อน) ยินดีรับฟังครับ! อาการที่คุณบอกมา หมออยากให้ชี้เป้าเพิ่มอีกนิด หรือลองพิมพ์บอกจุดที่ปวด เช่น ปวดคอ ปวดหลัง หรือเจ็บข้อมือ จะได้แนะนำวิธีแก้ให้ตรงจุดครับ 🩺✨'
        }
    ]);
}

// 5. โซนฟังก์ชันตอบกลับเฉพาะอาการต่างๆ (แก้ไขข้อความดิบให้เป็นระเบียบ)

function replyWelcome(replyToken) {
    return client.replyMessage(replyToken, [
        {
            type: 'text',
            text: 'สวัสดีครับ! ยินดีต้อนรับสู่ระบบดูแลสุขภาพ Office Syndrome 🩺✨\n\nคุณมีอาการปวดเมื่อยตรงไหนพิมพ์บอกหมอได้เลยนะ เช่น "ปวดคอบ่าไหล่", "ปวดหลังส่วนล่าง" หรือ "เจ็บข้อมือจากการจับเมาส์" เดี๋ยวหมอจัดท่าพยาบาลและไอเทมเด็ดๆ ให้ครับ!'
        }
    ]);
}

function replyNeckShoulder(replyToken) {
    return client.replyMessage(replyToken, [
        {
            type: 'text',
            text: 'เฮ้ยคุณ! อาการปวดคอ บ่า ไหล่ นี่ตัวท็อปของ Office Syndrome เลย กล้ามเนื้อ Upper Trapezius มันล้าจากการเกร็งมองจอและห่อไหล่ครับ แนะนำให้รีบเคลียร์ตามนี้เลย:\n\n🧘‍♂️ ยืดด่วน: ท่า Chin Tuck (เก็บคาง) หรือใช้มือขวาอ้อมไปจับหูซ้ายแล้วเอียงคอไปทางขวา ค้างไว้ 15 วินาที ทำสลับกันนะ\n\n💻 ไอเทมช่วยชีวิต: แนะนำให้หา "ขาตั้งจอคอม (Monitor Stand)" มายกจอให้อยู่ในระดับสายตา จะได้ไม่ต้องก้มคอครับ!'
        }
    ]);
}

function replyBackPain(replyToken) {
    return client.replyMessage(replyToken, [
        {
            type: 'text',
            text: 'ปวดหลังส่วนล่างใช่ไหมครับ? ถ้านั่งท่าเดิมนานๆ หมอนรองกระดูกจะรับแรงกดทับหนักมาก ยิ่งถ้าชอบนั่งพิงหลังงอเนี่ย ตัวดีเลย!\n\n🧘‍♂️ ยืดด่วน: ลุกขึ้นยืน เอามือค้ำเอวแล้วเอนตัวไปข้างหลังช้าๆ (Back Extension) ทำสัก 5-10 ครั้ง ให้กระดูกสันหลังได้ยืดออก\n\n🪑 ไอเทมช่วยชีวิต: "เบาะรองหลังเมมโมรี่โฟม" ที่รองรับส่วนโค้งของหลังส่วนล่าง หรือถ้าไหวจัด "เก้าอี้ Ergonomic" สักตัว หลังคุณจะกราบขอบคุณแน่นอนครับ'
        }
    ]);
}

function replyWristPain(replyToken) {
    return client.replyMessage(replyToken, [
        {
            type: 'text',
            text: 'ระวังอาการพังผืดทับเส้นประสาทข้อมือ (Carpal Tunnel) นะครับ! เกิดจากการจับเมาส์และข้อมือกระดกพาดขอบโต๊ะนานเกินไป\n\n🧘‍♂️ ยืดด่วน: ยืดแขนตรงไปข้างหน้า คว่ำมือลง แล้วใช้อีกมือดึงนิ้วมือเข้าหาตัว ค้างไว้ 15 วินาที\n\n🖱️ ไอเทมช่วยชีวิต: เปลี่ยนมาใช้ "แผ่นรองข้อมือแบบเจล" หรือขยับไปเล่น "เมาส์แนวตั้ง (Vertical Mouse)" จะช่วยลดแรงบิดที่ข้อมือได้เยอะมากครับเพื่อน!'
        }
    ]);
}

// 6. สั่งให้เซิร์ฟเวอร์เปิดทำงานตามพอร์ตที่กำหนด
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});