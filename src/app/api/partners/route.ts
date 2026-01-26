import { NextResponse } from 'next/server';
import { db } from '@/lib/connect-db';
import { partners } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    // Fetch all active partners
    const activePartners = await db.query.partners.findMany({
      where: eq(partners.isActive, true),
      columns: {
        id: true,
        name: true,
        location: true,
        slug: true,
      },
      orderBy: (partners, { asc }) => [asc(partners.name)],
    });

    return NextResponse.json(activePartners);
  } catch (error) {
    console.error('Error fetching partners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch partners' },
      { status: 500 }
    );
  }
}
