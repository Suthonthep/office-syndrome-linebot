const express = require('express');
const line = require('@line/bot-sdk');

const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET
};

const client = new line.Client(config);
const app = express();

// 💡 สร้างกล่องสำหรับแอบจำ ID ไลน์ของผู้ใช้งานทุกคนที่ทักเข้ามา
const activeUsers = new Set();

app.get('/', (req, res) => {
    res.send('Office Syndrome LINE Bot with Hourly Reminder is running!');
});

// 🚀 ลิงก์ลับสำหรับกดเทสเตือนทันที -> บอสสามารถเปิดเว็บ https://ลิงก์ของบอส.onrender.com/test-remind เพื่อสั่งยิงเตือนได้เลย
app.get('/test-remind', (req, res) => {
    sendHourlyReminder();
    res.send(`สั่งยิงข้อความเตือนผู้ใช้ในระบบทั้งหมด (จำนวน: ${activeUsers.size} คน) เรียบร้อยแล้วครับบอส!`);
});

app.post('/callback', line.middleware(config), (req, res) => {
    Promise
        .all(req.body.events.map(handleEvent))
        .then((result) => res.json(result))
        .catch((err) => {
            console.error('Error handling events:', err);
            res.status(500).end();
        });
});

function handleEvent(event) {
    // 🔍 สเตปแอบจำ ID: ทุกครั้งที่มีคนทักข้อความมา ให้ก๊อป ID ไลน์เขาเก็บไว้ในกล่องความจำ
    if (event.source && event.source.userId) {
        activeUsers.add(event.source.userId);
        console.log(`[จำ ID สำเร็จ]: มีคนใช้งานเพิ่มเข้ามา ID: ${event.source.userId}`);
    }

    if (event.type !== 'message' || event.message.type !== 'text') {
        return Promise.resolve(null);
    }

    const userText = event.message.text.trim().toLowerCase();

    if (userText === 'เริ่มใช้งาน' || userText === 'สวัสดี' || userText === 'help') {
        return replyWelcome(event.replyToken);
    }
    if (/คอ|บ่า|ไหล่|ตึงคอ|สะบัก|จ้องคอม/g.test(userText)) {
        return replyNeckShoulder(event.replyToken);
    }
    if (/หลัง|เอว|ก้มไม่ได้|นั่งนาน/g.test(userText)) {
        return replyBackPain(event.replyToken);
    }
    if (/ข้อมือ|นิ้วล็อค|ชา|เมาส์|คลิก/g.test(userText)) {
        return replyWristPain(event.replyToken);
    }

    return client.replyMessage(event.replyToken, [
        {
            type: 'text',
            text: 'หมอยินดีรับฟังครับ! อาการที่คุณบอกมา หมออยากให้ชี้เป้าเพิ่มอีกนิด หรือลองพิมพ์บอกจุดที่ปวด เช่น ปวดคอ ปวดหลัง หรือเจ็บข้อมือ จะได้แนะนำวิธีแก้ให้ตรงจุดครับ 🩺✨'
        }
    ]);
}

// ⏰ ฟังก์ชันสำหรับแพร่กระจายข้อความเตือนเรื่องการยืนไปให้ทุกคน
function sendHourlyReminder() {
    if (activeUsers.size === 0) {
        console.log('⚠️ ยังไม่มีใครทักบอทเข้ามาเลย ระบบเลยยังไม่มี ID สำหรับส่งเตือนครับ');
        return;
    }

    const reminderMessage = [
        {
            type: 'text',
            text: 'เอ๊ะ! ชั่วโมงนี้คุณได้ลุกไปยืนบ้างรึยังครับ? 🧘‍♂️✨\n\nถ้ายัง.. หมอขอเสนอท่ายืนง่ายๆ 1 ท่าช่วยชีวิต!\n\n🚶‍♂️ ท่ายืดเปิดอก (Chest Opening):\nยืนตรง เอามือประสานกันไว้ด้านหลัง จากนั้นยืดอกและบีบสะบักเข้าหากัน ยกแขนขึ้นช้าๆ ค้างไว้ 15 วินาที ท่านี้ช่วยลดอาการห่อไหล่และตึงอกจากการก้มทำงานได้ดีมากครับ! ลุกขึ้นมายืดเส้นกันเถอะะะ! 🔥'
        }
    ];

    // วนลูปส่งหาทุกคนที่อยู่ในความจำ
    activeUsers.forEach(userId => {
        client.pushMessage(userId, reminderMessage)
            .then(() => console.log(`ส่งข้อความเตือนไปที่ ID: ${userId} สำเร็จ`))
            .catch(err => console.error(`ส่งหา ID: ${userId} ล้มเหลว:`, err));
    });
}

// ⏱️ ตั้งเวลาในระบบให้รันฟังก์ชันเตือนทุกๆ 1 ชั่วโมงอัตโนมัติ (3600000 มิลลิวินาที)
setInterval(() => {
    console.log('⏰ ครบชั่วโมงแล้ว! กำลังส่งข้อความแจ้งเตือน...');
    sendHourlyReminder();
}, 60 * 60 * 1000);

function replyWelcome(replyToken) {
    return client.replyMessage(replyToken, [
        {
            type: 'text',
            text: 'สวัสดีครับ! ผมคือบอทเช็คอาการ Office Syndrome 🩺✨\n\nคอยช่วยแนะนำท่ายืดเส้นและไอเทมแก้ปวดให้คุณเอง! ตอนนี้ปวดเมื่อยตรงไหน พิมพ์บอกอาการมาได้เลยนะ เช่น ปวดคอ ปวดหลัง หรือเจ็บข้อมือครับ! 💪'
        }
    ]);
}

function replyNeckShoulder(replyToken) { /* โค้ดเดิมเหมือนรอบที่แล้วครับ */ }
function replyBackPain(replyToken) { /* โค้ดเดิมเหมือนรอบที่แล้วครับ */ }
function replyWristPain(replyToken) { /* โค้ดเดิมเหมือนรอบที่แล้วครับ */ }

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});