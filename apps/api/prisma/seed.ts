import { PrismaClient, QuestionType, Role, AssessmentKind } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("ChangeMe_123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@kaizentrix.com" },
    update: {},
    create: {
      email: "admin@kaizentrix.com",
      passwordHash: password,
      fullName: "Master Admin",
      role: Role.MASTER_ADMIN,
      staffProfile: { create: { designation: "Director of Assessments" } },
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@kaizentrix.com" },
    update: {},
    create: {
      email: "staff@kaizentrix.com",
      passwordHash: password,
      fullName: "Exam Invigilator",
      role: Role.STAFF,
      staffProfile: { create: { designation: "Invigilator" } },
    },
    include: { staffProfile: true },
  });

  const student = await prisma.user.upsert({
    where: { email: "student@kaizentrix.com" },
    update: {},
    create: {
      email: "student@kaizentrix.com",
      passwordHash: password,
      fullName: "Asha Rao",
      role: Role.STUDENT,
      studentProfile: { create: { rollNumber: "KGS-2026-001" } },
    },
  });

  const bank = await prisma.questionBank.upsert({
    where: { id: "11111111-1111-1111-1111-111111111111" },
    update: {},
    create: {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Recruitment Core",
      description: "Aptitude and technical screening items",
    },
  });

  const stems = [
    {
      stem: "If 3x + 5 = 20, what is x?",
      options: [
        { label: "A", text: "5", isCorrect: true },
        { label: "B", text: "3", isCorrect: false },
        { label: "C", text: "15", isCorrect: false },
        { label: "D", text: "7", isCorrect: false },
      ],
    },
    {
      stem: "Which data structure uses FIFO ordering?",
      options: [
        { label: "A", text: "Stack", isCorrect: false },
        { label: "B", text: "Queue", isCorrect: true },
        { label: "C", text: "Tree", isCorrect: false },
        { label: "D", text: "Graph", isCorrect: false },
      ],
    },
    {
      stem: "HTTP status 401 most closely means:",
      options: [
        { label: "A", text: "Not found", isCorrect: false },
        { label: "B", text: "Unauthorized", isCorrect: true },
        { label: "C", text: "Forbidden", isCorrect: false },
        { label: "D", text: "Server error", isCorrect: false },
      ],
    },
    {
      stem: "A train travels 120 km in 2 hours. Average speed is:",
      options: [
        { label: "A", text: "40 km/h", isCorrect: false },
        { label: "B", text: "60 km/h", isCorrect: true },
        { label: "C", text: "80 km/h", isCorrect: false },
        { label: "D", text: "240 km/h", isCorrect: false },
      ],
    },
    {
      stem: "In SQL, which clause filters grouped rows?",
      options: [
        { label: "A", text: "WHERE", isCorrect: false },
        { label: "B", text: "HAVING", isCorrect: true },
        { label: "C", text: "ORDER BY", isCorrect: false },
        { label: "D", text: "JOIN", isCorrect: false },
      ],
    },
  ];

  const createdQuestions = [];
  for (const item of stems) {
    const existing = await prisma.question.findFirst({ where: { stem: item.stem } });
    if (existing) {
      createdQuestions.push(existing);
      continue;
    }
    createdQuestions.push(
      await prisma.question.create({
        data: {
          bankId: bank.id,
          type: QuestionType.SINGLE_MCQ,
          stem: item.stem,
          marks: 2,
          negativeMarks: 0.5,
          options: { create: item.options },
        },
      }),
    );
  }

  let exam = await prisma.exam.findFirst({ where: { title: "Graduate Aptitude Screen 2026" } });
  if (!exam) {
    exam = await prisma.exam.create({
      data: {
        title: "Graduate Aptitude Screen 2026",
        kind: AssessmentKind.MIXED,
        description: "Timed aptitude and technical MCQ for internship shortlisting.",
        durationMinutes: 30,
        status: "PUBLISHED",
        publishedAt: new Date(),
        warningPolicy: { create: { locked: true, cooldownSeconds: 15 } },
        runs: { create: { status: "SCHEDULED" } },
        sections: {
          create: {
            title: "Core reasoning",
            order: 1,
            kind: AssessmentKind.MIXED,
            questions: {
              create: createdQuestions.map((q, order) => ({
                questionId: q.id,
                order,
                marks: 2,
              })),
            },
          },
        },
      },
    });
  }

  await prisma.examAssignment.upsert({
    where: { examId_studentId: { examId: exam.id, studentId: student.id } },
    create: { examId: exam.id, studentId: student.id },
    update: {},
  });

  if (staff.staffProfile) {
    await prisma.staffExamAssignment.upsert({
      where: {
        examId_staffProfileId: { examId: exam.id, staffProfileId: staff.staffProfile.id },
      },
      create: { examId: exam.id, staffProfileId: staff.staffProfile.id },
      update: {},
    });
  }

  console.log("Seeded users:");
  console.log("  admin@kaizentrix.com / ChangeMe_123");
  console.log("  staff@kaizentrix.com / ChangeMe_123");
  console.log("  student@kaizentrix.com / ChangeMe_123");
  console.log(`Exam: ${exam.title} (${exam.id})`);
  console.log(`Admin id: ${admin.id}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
