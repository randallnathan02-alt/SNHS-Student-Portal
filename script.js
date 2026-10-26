-- Allow students to read only their own grades.
DROP POLICY IF EXISTS "Students read their own grades"
ON public.student_grades;

CREATE POLICY "Students read their own grades"
ON public.student_grades
FOR SELECT
TO authenticated
USING (
    student_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role = 'student'
          AND profiles.is_active = true
    )
);

-- Allow authenticated users to read terms and subjects.
-- Admins retain their existing management permissions.
DROP POLICY IF EXISTS "Authenticated users read academic terms"
ON public.academic_terms;

CREATE POLICY "Authenticated users read academic terms"
ON public.academic_terms
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users read subjects"
ON public.subjects;

CREATE POLICY "Authenticated users read subjects"
ON public.subjects
FOR SELECT
TO authenticated
USING (true);
