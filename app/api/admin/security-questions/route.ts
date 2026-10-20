import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { getAdminSession } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      hasConfiguredQuestions: Boolean(admin.securitySport && admin.securityTeacher),
      questions: [
        'What is your favorite sport?',
        'Who is your favorite teacher?',
      ],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, sportAnswer, teacherAnswer } = body;

    if (!currentPassword || !sportAnswer || !teacherAnswer) {
      return NextResponse.json(
        { success: false, error: 'Current password and answers to both questions are required.' },
        { status: 400 }
      );
    }

    const passwordMatches = await bcrypt.compare(currentPassword, admin.password);
    if (!passwordMatches) {
      return NextResponse.json(
        { success: false, error: 'Incorrect current password.' },
        { status: 400 }
      );
    }

    const sportHash = await bcrypt.hash(sportAnswer.trim().toLowerCase(), 10);
    const teacherHash = await bcrypt.hash(teacherAnswer.trim().toLowerCase(), 10);

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        securitySport: sportHash,
        securityTeacher: teacherHash,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Security questions updated successfully.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
