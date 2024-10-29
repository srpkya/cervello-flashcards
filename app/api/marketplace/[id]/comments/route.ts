import { getDb } from "@/lib/db";
import { deckComment, user } from "@/lib/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDb();

    // Join with user table to get commenter information
    const comments = await db
      .select({
        id: deckComment.id,
        content: deckComment.content,
        createdAt: deckComment.createdAt,
        user: {
          id: user.id,
          name: user.name,
          image: user.image,
        }
      })
      .from(deckComment)
      .leftJoin(user, eq(deckComment.userId, user.id))
      .where(eq(deckComment.sharedDeckId, params.id))
      .orderBy(deckComment.createdAt);

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    const newComment = {
      id: crypto.randomUUID(),
      sharedDeckId: params.id,
      userId: session.user.id,
      content: content.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.insert(deckComment).values(newComment);

    // Fetch the complete comment with user information
    const commentWithUser = await db
      .select({
        id: deckComment.id,
        content: deckComment.content,
        createdAt: deckComment.createdAt,
        user: {
          id: user.id,
          name: user.name,
          image: user.image,
        }
      })
      .from(deckComment)
      .leftJoin(user, eq(deckComment.userId, user.id))
      .where(eq(deckComment.id, newComment.id))
      .get();

    return NextResponse.json(commentWithUser);
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}