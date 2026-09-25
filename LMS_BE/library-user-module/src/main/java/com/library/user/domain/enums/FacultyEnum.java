package com.library.user.domain.enums;

import lombok.Getter;

@Getter
public enum FacultyEnum {
  KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH("Khoa Khoa học và Kỹ thuật Máy tính"),
  KHOA_DIEN_DIEN_TU("Khoa Điện - Điện tử"),
  KHOA_CO_KHI("Khoa Cơ khí"),
  KHOA_KY_THUAT_HOA_HOC("Khoa Kỹ thuật Hóa học"),
  KHOA_KY_THUAT_XAY_DUNG("Khoa Kỹ thuật Xây dựng"),
  KHOA_KY_THUAT_GIAO_THONG("Khoa Kỹ thuật Giao thông"),
  KHOA_QUAN_LY_CONG_NGHIEP("Khoa Quản lý Công nghiệp"),
  KHOA_MOI_TRUONG_VA_TAI_NGUYEN("Khoa Môi trường và Tài nguyên"),
  KHOA_CONG_NGHE_VAT_LIEU("Khoa Công nghệ Vật liệu"),
  KHOA_KHOA_HOC_UNG_DUNG("Khoa Khoa học Ứng dụng"),
  KHOA_KY_THUAT_DIA_CHAT_VA_DAU_KHI("Khoa Kỹ thuật Địa chất và Dầu khí");

  private final String name;

  // Constructor cho Enum
  FacultyEnum(String name) {
    this.name = name;
  }
}
