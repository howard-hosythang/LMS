import { formatReviewerAcademicLine, getStudentCohort } from '../../utils/reviewerMeta';

describe('reviewerMeta', () => {
  it('derives the student cohort from the first two digits of a student ID', () => {
    expect(getStudentCohort('2213188')).toBe('K22');
  });

  it('shows cohort and faculty for student reviews', () => {
    expect(formatReviewerAcademicLine({
      studentId: '2213188',
      faculty: 'KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH',
      role: 'student',
    })).toBe('K22 - Khoa khoa học và Kỹ thuật Máy tính');
  });

  it('shows English cohort and faculty for student reviews in English mode', () => {
    expect(formatReviewerAcademicLine({
      studentId: '2213188',
      faculty: 'KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH',
      role: 'student',
      language: 'en',
    })).toBe('K22 - Faculty of Computer Science and Engineering');
  });

  it('shows only faculty for staff or lecturer reviews', () => {
    expect(formatReviewerAcademicLine({
      studentId: 'CB001',
      faculty: 'KHOA_DIEN_DIEN_TU',
      role: 'lecturer',
    })).toBe('Khoa điện - Điện tử');
  });
});
