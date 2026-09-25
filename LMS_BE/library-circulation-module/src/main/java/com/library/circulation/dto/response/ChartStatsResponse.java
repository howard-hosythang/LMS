package com.library.circulation.dto.response;

public record ChartStatsResponse(
        Integer month,
        Integer borrowedItems
) {
}
