package com.library.circulation.application.dashboard;

import com.library.circulation.dto.response.ReaderActivityTimelineResponse;
import com.library.circulation.dto.response.ReaderProfileResponse;
import java.util.List;

public interface ReaderProfileUseCase {

  ReaderProfileResponse getProfile(Long userId, String studentId);

  List<ReaderActivityTimelineResponse> getTimeline(Long userId, String studentId, int limit);
}
