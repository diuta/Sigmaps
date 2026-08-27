export async function POST(request: Request) {
  const body = await request.json();       

  const res = await fetch("https://server.mapid.io/web/competition/activities", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.MAPID_API_KEY!, 
    },
    body: JSON.stringify(body),
  });

  return Response.json(await res.json(), { status: res.status });
}