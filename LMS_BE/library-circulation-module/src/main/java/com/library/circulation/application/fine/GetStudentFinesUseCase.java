package com.library.circulation.application.fine;

import com.library.circulation.dto.response.StudentFinesResponse;

public interface GetStudentFinesUseCase {
    StudentFinesResponse execute(String studentId);
}
