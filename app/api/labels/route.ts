// app/api/labels/route.ts
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { label } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const db = await getDb();
    const labels = await db
      .select({
        id: label.id,
        name: label.name,
        createdAt: label.createdAt
      })
      .from(label)
      .orderBy(label.name);

    return NextResponse.json(labels);
  } catch (error) {
    console.error('Error fetching labels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch labels' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { error: 'Label name is required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Check if label already exists
    const existingLabel = await db
      .select()
      .from(label)
      .where(eq(label.name, name))
      .get();

    if (existingLabel) {
      return NextResponse.json(existingLabel);
    }

    // Create new label
    const newLabel = {
      id: crypto.randomUUID(),
      name,
      createdAt: Date.now()
    };

    await db.insert(label).values(newLabel);
    return NextResponse.json(newLabel);

  } catch (error) {
    console.error('Error creating label:', error);
    return NextResponse.json(
      { error: 'Failed to create label' },
      { status: 500 }
    );
  }
}