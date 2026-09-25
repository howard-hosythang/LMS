package com.library.circulation.dto.response;

import java.math.BigDecimal;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StudentFinesResponse {
    private String studentId;
    private String fullName;
    private BigDecimal totalUnpaidAmount;
    private List<FineResponse> fines;
}
