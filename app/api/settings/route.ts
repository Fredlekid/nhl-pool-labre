import { prisma } from "@/lib/db";

export async function GET() {
  const settings = await prisma.settings.findFirst();
  return Response.json({ picksLocked: settings?.picksLocked ?? false });
}
