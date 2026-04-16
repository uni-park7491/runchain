import { NextRequest } from 'next/server';
import { getRunChainContract } from '@/lib/contract';

export const runtime = 'edge';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const fetchData = async () => {
        try {
          const contract = getRunChainContract();
          const raw = await contract.getChallenge(id);
          const parts: string[] = await contract.getParticipants(id);
          const records = await Promise.all(
            parts.map(async (p: string) => {
              const rec = await contract.getParticipantRecord(id, p);
              return { address: p, distance: Number(rec[0]), warnings: Number(rec[1]) };
            })
          );
          records.sort((a, b) => b.distance - a.distance);
          send({ type: 'update', data: records, timestamp: Date.now() });
        } catch (e) {
          send({ type: 'error', message: '데이터 로드 실패' });
        }
      };

      send({ type: 'connected' });
      await fetchData();

      const interval = setInterval(fetchData, 30000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
