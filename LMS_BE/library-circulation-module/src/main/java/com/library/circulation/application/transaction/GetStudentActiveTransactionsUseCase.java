package com.library.circulation.application.transaction;

import com.library.circulation.dto.response.StudentActiveTransactionsResponse;

public interface GetStudentActiveTransactionsUseCase {
    StudentActiveTransactionsResponse execute(String studentId);
}
