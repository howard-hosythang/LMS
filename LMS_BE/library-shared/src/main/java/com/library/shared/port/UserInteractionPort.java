package com.library.shared.port;

public interface UserInteractionPort {
    String TYPE_VIEW = "WATCH";
    String TYPE_BORROW = "BORROWED";
    String TYPE_WISHLIST = "WISHLIST";

    void record(Long userId, Long publicationId, String interactionType);
}
