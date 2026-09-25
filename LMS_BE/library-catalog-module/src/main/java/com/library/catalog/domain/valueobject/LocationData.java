package com.library.catalog.domain.valueobject;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Value;

/**
 * Value Object encapsulating publication metadata (title, description, language, etc.).
 * Immutable and self-validating.
 */
@Value
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class LocationData {
    String branch;
    String building;
    String floor;
    String room;
    String shelf;

    public static LocationData of(String branch, String building, String floor, String room, String shelf){
        return new LocationData(branch, building, floor, room, shelf);
    }
}
