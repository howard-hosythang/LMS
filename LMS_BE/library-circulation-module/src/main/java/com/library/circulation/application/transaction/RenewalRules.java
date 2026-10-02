package com.library.circulation.application.transaction;

import com.library.circulation.application.policy.CirculationPolicy;
import com.library.circulation.domain.enums.TransactionStatus;
import com.library.shared.exception.ErrorCode;
import java.time.LocalDate;

/** Shared eligibility rules for the renewal command and librarian lookup. */
public final class RenewalRules {
    private RenewalRules() {}

    public static ErrorCode basicFailure(TransactionStatus status, LocalDate dueDate,
        int renewalCount, CirculationPolicy policy, LocalDate today) {
        if (status == TransactionStatus.OVERDUE || (dueDate != null && today.isAfter(dueDate))) {
            return ErrorCode.RENEWAL_OVERDUE;
        }
        if (status != TransactionStatus.BORROWING) return ErrorCode.RENEWAL_NOT_BORROWING;
        if (dueDate == null) return ErrorCode.RENEWAL_MISSING_DUE_DATE;
        if (renewalCount >= policy.maxRenewals()) return ErrorCode.RENEWAL_LIMIT_REACHED;
        if (today.isBefore(dueDate.minusDays(policy.renewalWindowDays()))) return ErrorCode.RENEWAL_NOT_IN_WINDOW;
        return null;
    }

    public static String describe(ErrorCode failure, int renewalCount, CirculationPolicy policy) {
        if (failure == null) return null;
        if (failure == ErrorCode.RENEWAL_LIMIT_REACHED) {
            return "Đã hết lượt gia hạn (" + renewalCount + "/" + policy.maxRenewals() + ")";
        }
        if (failure == ErrorCode.RENEWAL_NOT_IN_WINDOW) {
            return "Chưa đến thời điểm gia hạn (chỉ mở trước hạn " + policy.renewalWindowDays() + " ngày)";
        }
        return failure.getMessageVi();
    }
}
