package com.library.circulation.application.transaction;

import com.library.circulation.dto.request.ReportIssueCommand;
import com.library.circulation.dto.response.ReportIssueResponse;

public interface ReportIssueUseCase {
    ReportIssueResponse execute(Long transactionId, Long librarianId, ReportIssueCommand command);
}
