package com.library.catalog.application;

import com.library.catalog.dto.response.publication.PublicTestimonialResponse;
import java.util.List;

public interface GetPublicTestimonialsUseCase {
  List<PublicTestimonialResponse> execute(int limit);
}
