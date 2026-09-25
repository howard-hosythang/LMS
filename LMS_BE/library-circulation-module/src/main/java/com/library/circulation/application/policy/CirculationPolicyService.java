package com.library.circulation.application.policy;

import com.library.circulation.dto.request.UpdateCirculationPolicyRequest;

public interface CirculationPolicyService {
    CirculationPolicy getPolicy();

    CirculationPolicy updatePolicy(UpdateCirculationPolicyRequest request, Long adminId);
}
