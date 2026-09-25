import { facultyLabel } from './facultyLabels';

type ReviewerLanguage = 'vi' | 'en';

const UNKNOWN_FACULTY = {
  vi: 'Chưa có khoa',
  en: 'No faculty',
};

const lowerFirst = (value: string) =>
  value ? value.charAt(0).toLocaleLowerCase('vi-VN') + value.slice(1) : value;

export const formatReviewerFaculty = (faculty?: string | null, language: ReviewerLanguage = 'vi') => {
  if (!faculty) return '';
  const label = facultyLabel(faculty, language);
  if (!label || label === UNKNOWN_FACULTY[language]) return '';
  return language === 'en' ? `Faculty of ${label}` : `Khoa ${lowerFirst(label)}`;
};

export const getStudentCohort = (studentId?: string | null) => {
  const normalized = String(studentId ?? '').trim();
  const match = normalized.match(/^(\d{2})\d{5,}$/);
  return match ? `K${match[1]}` : '';
};

const isStudentRole = (role?: string | null) => {
  const normalized = String(role ?? '').toLowerCase();
  return normalized.includes('student') || normalized.includes('sinh viên');
};

const isNonStudentRole = (role?: string | null) => {
  const normalized = String(role ?? '').toLowerCase();
  return ['lecturer', 'giảng viên', 'teacher', 'staff', 'cán bộ', 'librarian', 'thủ thư', 'admin'].some((keyword) =>
    normalized.includes(keyword)
  );
};

export const formatReviewerAcademicLine = ({
  studentId,
  faculty,
  role,
  fallback = '',
  language = 'vi',
}: {
  studentId?: string | null;
  faculty?: string | null;
  role?: string | null;
  fallback?: string;
  language?: ReviewerLanguage;
}) => {
  const facultyText = formatReviewerFaculty(faculty, language);
  const cohort = getStudentCohort(studentId);
  const shouldShowCohort = cohort && (isStudentRole(role) || !isNonStudentRole(role));

  if (shouldShowCohort && facultyText) return `${cohort} - ${facultyText}`;
  if (shouldShowCohort) return cohort;
  return facultyText || role || fallback;
};
