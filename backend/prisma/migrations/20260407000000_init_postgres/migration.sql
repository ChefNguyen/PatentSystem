-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT,
    "department_id" TEXT,
    "section" TEXT,
    "permission" TEXT NOT NULL DEFAULT '一般',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "no" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "titles" (
    "id" TEXT NOT NULL,
    "title_no" TEXT NOT NULL,
    "title_name" TEXT NOT NULL,
    "data_type" TEXT NOT NULL DEFAULT '特許',
    "mark_color" TEXT,
    "parent_title_id" TEXT,
    "main_owner_id" TEXT,
    "save_date" TEXT NOT NULL,
    "disallow_evaluation" BOOLEAN NOT NULL DEFAULT false,
    "allow_evaluation" BOOLEAN NOT NULL DEFAULT true,
    "view_permission" TEXT NOT NULL DEFAULT 'all',
    "edit_permission" TEXT NOT NULL DEFAULT 'creator',
    "main_evaluation" BOOLEAN NOT NULL DEFAULT true,
    "single_patent_multiple_evals" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "titles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "title_users" (
    "id" TEXT NOT NULL,
    "title_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "is_main_responsible" BOOLEAN NOT NULL DEFAULT false,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "is_general" BOOLEAN NOT NULL DEFAULT true,
    "is_viewer" BOOLEAN NOT NULL DEFAULT false,
    "eval_email" BOOLEAN NOT NULL DEFAULT false,
    "confirm_email" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "title_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patents" (
    "id" TEXT NOT NULL,
    "title_id" TEXT NOT NULL,
    "document_num" TEXT,
    "application_num" TEXT,
    "application_date" TIMESTAMP(3),
    "publication_date" TIMESTAMP(3),
    "invention_title" TEXT,
    "applicant_name" TEXT,
    "fi_classification" TEXT,
    "publication_num" TEXT,
    "announcement_num" TEXT,
    "registration_num" TEXT,
    "appeal_num" TEXT,
    "abstract" TEXT,
    "claims" TEXT,
    "other_info" TEXT,
    "status_stage" TEXT,
    "event_detail" TEXT,
    "document_url" TEXT,
    "evaluation_status" TEXT NOT NULL DEFAULT '未評価',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" TEXT NOT NULL,
    "patent_id" TEXT NOT NULL,
    "title_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "comment" TEXT,
    "score" INTEGER,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patent_classifications" (
    "id" TEXT NOT NULL,
    "patent_id" TEXT NOT NULL,
    "title_id" TEXT NOT NULL,
    "classification_type" TEXT NOT NULL,
    "classification_value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patent_classifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "title_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "title_id" TEXT,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
    "details" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patent_assignments" (
    "id" TEXT NOT NULL,
    "patent_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patent_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_user_id_key" ON "users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "departments_no_key" ON "departments"("no");

-- CreateIndex
CREATE UNIQUE INDEX "titles_title_no_key" ON "titles"("title_no");

-- CreateIndex
CREATE UNIQUE INDEX "title_users_title_id_user_id_key" ON "title_users"("title_id", "user_id");

-- CreateIndex
CREATE INDEX "patents_title_id_idx" ON "patents"("title_id");

-- CreateIndex
CREATE INDEX "patents_applicant_name_idx" ON "patents"("applicant_name");

-- CreateIndex
CREATE INDEX "patents_application_date_idx" ON "patents"("application_date");

-- CreateIndex
CREATE INDEX "patents_publication_date_idx" ON "patents"("publication_date");

-- CreateIndex
CREATE INDEX "evaluations_patent_id_idx" ON "evaluations"("patent_id");

-- CreateIndex
CREATE INDEX "evaluations_title_id_idx" ON "evaluations"("title_id");

-- CreateIndex
CREATE INDEX "evaluations_user_id_idx" ON "evaluations"("user_id");

-- CreateIndex
CREATE INDEX "patent_classifications_title_id_classification_type_classif_idx" ON "patent_classifications"("title_id", "classification_type", "classification_value");

-- CreateIndex
CREATE UNIQUE INDEX "patent_classifications_patent_id_title_id_classification_ty_key" ON "patent_classifications"("patent_id", "title_id", "classification_type", "classification_value");

-- CreateIndex
CREATE INDEX "attachments_title_id_idx" ON "attachments"("title_id");

-- CreateIndex
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "activity_logs_title_id_idx" ON "activity_logs"("title_id");

-- CreateIndex
CREATE INDEX "activity_logs_target_type_target_id_idx" ON "activity_logs"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");

-- CreateIndex
CREATE INDEX "patent_assignments_patent_id_idx" ON "patent_assignments"("patent_id");

-- CreateIndex
CREATE INDEX "patent_assignments_user_id_idx" ON "patent_assignments"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "patent_assignments_patent_id_user_id_key" ON "patent_assignments"("patent_id", "user_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "titles" ADD CONSTRAINT "titles_parent_title_id_fkey" FOREIGN KEY ("parent_title_id") REFERENCES "titles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "titles" ADD CONSTRAINT "titles_main_owner_id_fkey" FOREIGN KEY ("main_owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "title_users" ADD CONSTRAINT "title_users_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "title_users" ADD CONSTRAINT "title_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patents" ADD CONSTRAINT "patents_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_patent_id_fkey" FOREIGN KEY ("patent_id") REFERENCES "patents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "titles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patent_classifications" ADD CONSTRAINT "patent_classifications_patent_id_fkey" FOREIGN KEY ("patent_id") REFERENCES "patents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patent_classifications" ADD CONSTRAINT "patent_classifications_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "titles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patent_assignments" ADD CONSTRAINT "patent_assignments_patent_id_fkey" FOREIGN KEY ("patent_id") REFERENCES "patents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patent_assignments" ADD CONSTRAINT "patent_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Lock down Supabase Data API exposure. This project uses Prisma + Express, not direct public PostgREST access.
ALTER TABLE IF EXISTS public."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."departments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."titles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."title_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."patents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."evaluations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."patent_classifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."attachments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."activity_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."patent_assignments" ENABLE ROW LEVEL SECURITY;
