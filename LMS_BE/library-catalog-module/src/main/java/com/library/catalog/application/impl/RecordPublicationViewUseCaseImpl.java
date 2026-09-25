package com.library.catalog.application.impl;

import com.library.catalog.application.RecordPublicationViewUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RecordPublicationViewUseCaseImpl implements RecordPublicationViewUseCase {

    private final com.library.shared.port.UserInteractionPort userInteractionPort;

    @Override
    public void execute(Long publicationId, Long userId) {
        userInteractionPort.record(userId, publicationId, com.library.shared.port.UserInteractionPort.TYPE_VIEW);
    }
}
