export async function GET() {
  return new Response(JSON.stringify({ message: 'not implemented' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
}
