package com.library.circulation.domain.enums;

public enum ReservationStatus {
  PENDING,
  READY_FOR_PICKUP,  // có sách rồi
  CANCELLED,
  EXPIRED,
  COMPLETED         // user đã lấy
}
