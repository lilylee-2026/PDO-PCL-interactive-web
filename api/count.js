import { connectToDatabase } from './db.js';

export default async function handler(req, res) {
  // 1. 요청 진입 확인
  console.log('>>> API Request Received:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // 2. 바디 데이터 확인 (uuid가 제대로 오는지)
    const { uuid } = req.body;
    console.log('>>> Request Body UUID:', uuid);

    if (!uuid) {
      console.warn('!!! Warning: UUID is missing in request body');
    }

    // 3. DB 연결 시도 확인
    console.log('>>> Connecting to Database...');
    const client = await connectToDatabase();
    const db = client.db('LiftingSimDB');
    const collection = db.collection('visitors');
    console.log('>>> DB Connected Successfully');

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // 한국 시간(KST) 계산
    const curr = new Date();
    const utc = curr.getTime() + curr.getTimezoneOffset() * 60 * 1000;
    const KR_TIME_DIFF = 9 * 60 * 60 * 1000;
    const kstNow = new Date(utc + KR_TIME_DIFF);
    const kstString = kstNow.toISOString().replace(/T/, ' ').replace(/\..+/, '');

    const updateData = {
      ip,
      userAgent: req.headers['user-agent'],
      lastVisited: kstNow,
      lastVisitedStr: kstString,
    };

    const firstTimeData = {
      uuid,
      firstVisited: kstNow,
      firstVisitedStr: kstString,
    };

    // 4. 실행 직전 쿼리 확인
    console.log('>>> Attempting updateOne for UUID:', uuid);

    const result = await collection.updateOne(
      { uuid },
      {
        $set: updateData,
        $setOnInsert: firstTimeData,
      },
      { upsert: true },
    );

    // 5. 실행 결과 상세 로그 (중요!)
    console.log('>>> MongoDB Result:', {
      acknowledged: result.acknowledged,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount,
      upsertedId: result.upsertedId,
    });

    return res.status(200).json({ success: true, status: result });
  } catch (error) {
    // 6. 에러 발생 시 상세 정보 출력
    console.error('!!! Database Error Details:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
