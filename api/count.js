import { connectToDatabase } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db('LiftingSimDB');
    const collection = db.collection('visitors');

    const { uuid } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // 한국 시간(KST) 계산
    const curr = new Date();
    const utc = curr.getTime() + curr.getTimezoneOffset() * 60 * 1000; // UTC 시간대 계산
    const KR_TIME_DIFF = 9 * 60 * 60 * 1000; // 한국은 UTC보다 9시간 빠름
    const kstNow = new Date(utc + KR_TIME_DIFF);

    // 가독성을 위한 날짜 문자열 (예: "2026-03-16 15:30:45")
    const kstString = kstNow.toISOString().replace(/T/, ' ').replace(/\..+/, '');

    // 1. 매 접속마다 갱신될 데이터
    const updateData = {
      ip,
      userAgent: req.headers['user-agent'],
      lastVisited: kstNow, // Date 객체 (KST 기준)
      lastVisitedStr: kstString, // 읽기 쉬운 문자열
    };

    // 2. 최초 접속 시에만 저장될 데이터
    const firstTimeData = {
      uuid,
      firstVisited: kstNow, // 최초 접속 날짜 고정
      firstVisitedStr: kstString,
    };

    const result = await collection.updateOne(
      { uuid },
      {
        $set: updateData,
        $setOnInsert: firstTimeData,
      },
      { upsert: true },
    );

    return res.status(200).json({ success: true, status: result });
  } catch (error) {
    console.error('Database Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
