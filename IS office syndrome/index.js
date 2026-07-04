const express = require('express');
const line = require('@line/bot-sdk');

const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || 'YOUR_CHANNEL_ACCESS_TOKEN',
    channelSecret: process.env.CHANNEL_SECRET || 'YOUR_CHANNEL_SECRET'
};

const client = new line.Client(config);
const app = express();

// หน้าแรกสำหรับเช็คว่า Server บน Render ทำงานอยู่ไหม
app.get('/', (req, res) => {
    res.send('Office Syndrome Bot is running perfectly!');
});

// Webhook สำหรับเชื่อมต่อกับ LINE Developer Console
app.post('/callback', line.middleware(config), (req, res) => {
    Promise
        .all(req.body.events.map(handleEvent))
        .then((result) => res.json(result))
        .catch((err) => {
            console.error(err);
            res.status(500).end();
        });
});

// ฟังก์ชันหลักในการคิดและประมวลผลข้อความ (สมอง Level 2)
function handleEvent(event) {
    if (event.type !== 'message' || event.message.type !== 'text') {
        return Promise.resolve(null);
    }

    const userText = event.message.text.trim().toLowerCase();

    // 1. ระบบตรวจจับข้อความทักทาย / เริ่มต้น
    if (userText === 'เริ่มใช้งาน' || userText === 'สวัสดี' || userText === 'help') {
        return sendMainMenu(event.replyToken);
    }

    // 2. สมองวิเคราะห์อาการ (Intent Classification) โดยใช้ คีย์เวิร์ดบริบท (Contextual Keywords)
    // อาการที่ 1: คอ บ่า ไหล่
    if (/คอ|บ่า|ไหล่|ตึงคอ|สบัก|จ้องคอม/g.test(userText)) {
        return replyNeckShoulder(event.replyToken);
    }
    
    // อาการที่ 2: หลัง / เอว
    if (/หลัง|เอว|ก้มไม่ได้|นั่งนาน/g.test(userText)) {
        return replyBackPain(event.replyToken);
    }

    // อาการที่ 3: ข้อมือ / มือชา
    if (/ข้อมือ|นิ้วล็อก|ชา|เมาส์|คลิก/g.test(userText)) {
        return replyWristPain(event.replyToken);
    }

    // 3. กรณีที่บอทไม่แน่ใจ (Fallback) ให้ตอบแบบสุภาพ/เป็นกันเอง แล้วส่งเมนูให้เลือก
    return client.replyMessage(event.replyToken, [
        {
            type: 'text',
            text: 'หมอ (และเพื่อน) ยินดีรับฟังครับ! อาการที่คุณบอกมา หมออยากให้ชี้เป้าเพิ่มอีกนิด หรือลองกดเลือก "อาการยอดฮิต" จากปุ่มด้านล่างนี้ได้เลยนะ จะได้แก้ให้ตรงจุดครับ 🩺✨'
        },
        createMainMenuFlex()
    ]);
}

// ------------------ โซนคำแนะนำเฉพาะอาการ (สวมบทบาทแพทย์+เพื่อน) ------------------

function replyNeckShoulder(replyToken) {
    return client.replyMessage(replyToken, [
        {
            type: 'text',
            text: 'เฮ้ยคุณ! อาการปวดคอ บ่า ไหล่ นี่ตัวท็อปของ Office Syndrome เลย กล้ามเนื้อ Upper Trapezius มันล้าจากการเกร็งมองจอและห่อไหล่ครับ หมอแนะนำให้รีบเคลียร์ตามนี้เลย:'
        },
        {
            type: 'text',
            text: 'ยืดด่วน: ท่า Chin Tuck (เก็บคาง) หรือใช้มือขวาอ้อมไปจับหูซ้ายแล้วเอียงคอไปทางขวา ค้างไว้ 15 วินาที ทำสลับกันนะ\n\nไอเทมช่วยชีวิต: แนะนำให้หา "ขาตั้งจอคอม (Monitor Stand)" มายกจอให้อยู่ในระดับสายตา จะได้ไม่ต้องก้มคอครับ!'
        }
    ]);
}

function replyBackPain(replyToken) {
    return client.replyMessage(replyToken, [
        {
            type: 'text',
            text: 'ปวดหลังส่วนล่างใช่ไหมครับ? ถ้านั่งท่าเดิมนานๆ หมอนรองกระดูกจะรับแรงกดทับหนักมาก ยิ่งถ้าชอบนั่งพิงหลังงอเนี่ย ตัวดีเลย!'
        },
        {
            type: 'text',
            text: 'ยืดด่วน: ลุกขึ้นยืน เอามือค้ำเอวแล้วเอนตัวไปข้างหลังช้าๆ (Back Extension) ทำสัก 5-10 ครั้ง ให้กระดูกสันหลังได้ยืดออก\n\nไอเทมช่วยชีวิต: "เบาะรองหลังเมมโมรี่โฟม" ที่รองรับส่วนโค้งของหลังส่วนล่าง หรือถ้าไหวจัด "เก้าอี้ Ergonomic" สักตัว หลังคุณจะกราบขอบคุณแน่นอนครับ'
        }
    ]);
}

function replyWristPain(replyToken) {
    return client.replyMessage(replyToken, [
        {
            type: 'text',
            text: 'ระวังอาการพังผืดทับเส้นประสาทข้อมือ (Carpal Tunnel) นะครับ! เกิดจากการจับเมาส์และข้อมือกระดกพาดขอบโต๊ะนานเกินไป'
        },
        {
            type: 'text',
            text: 'ยืดด่วน: ยืดแขนตรงไปข้างหน้า คว่ำมือลง แล้วใช้อีกมือดึงนิ้วมือเข้าหาตัว ค้างไว้ 15 วินาที\n\nไอเทมช่วยชีวิต: เปลี่ยนมาใช้ "แผ่นรองข้อมือแบบเจล" หรือขยับไปเล่น "เมาส์แนวตั้ง (Vertical Mouse)" จะช่วยลดแรงบิดที่ข้อมือได้เยอะมากครับเพื่อน!'
        }
    ]);
}

// ------------------ โซนสร้าง UI (Flex Message) ------------------

function sendMainMenu(replyToken) {
    return client.replyMessage(replyToken, [
        {
            type: 'text',
            text: 'สวัสดีครับ! ยินดีต้อนรับสู่บอทเพื่อนคู่คิดสู้ Office Syndrome 💻✨\n\nพิมพ์คุยกับผมได้เลย เช่น "ปวดหลังจัง" หรือกดเลือกอาการยอดฮิตจากเมนูด้านล่างนี้ได้เลยครับ!'
        },
        createMainMenuFlex()
    ]);
}

function createMainMenuFlex() {
    return {
        type: 'flex',
        altText: 'เลือกอาการยอดฮิตเพื่อรับคำแนะนำ',
        contents: {
            type: 'bubble',
            header: {
                type: 'box',
                layout: 'vertical',
                backgroundColor: '#1DB446',
                contents: [
                    { type: 'text', text: '🚨 เช็คอาการยอดฮิต', weight: 'bold', color: '#FFFFFF', size: 'lg' }
                ]
            },
            body: {
                type: 'box',
                layout: 'vertical',
                spacing: 'md',
                contents: [
                    {
                        type: 'button',
                        style: 'primary',
                        color: '#464646',
                        action: { type: 'message', label: '💥 ปวดคอ บ่า ไหล่', text: 'ปวดคอบ่าไหล่ตึงมาก' }
                    },
                    {
                        type: 'button',
                        style: 'primary',
                        color: '#464646',
                        action: { type: 'message', label: '🪵 ปวดหลัง / เอว', text: 'นั่งนานจนปวดหลัง' }
                    },
                    {
                        type: 'button',
                        style: 'primary',
                        color: '#464646',
                        action: { type: 'message', label: '🖱️ ข้อมือชา / นิ้วล็อก', text: 'ปวดข้อมือชาๆ' }
                    }
                ]
            }
        }
    };
}

// ตั้งค่า Port และรัน Server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});