package com.library.circulation.application.fine;

public interface PayAllFinesUseCase {
    int execute(String studentId, Long librarianId);
}
