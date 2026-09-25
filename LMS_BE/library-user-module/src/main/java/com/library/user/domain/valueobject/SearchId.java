package com.library.user.domain.valueobject;

import com.library.shared.util.TsIdGenerator;
import lombok.Value;

@Value
public class SearchId {
    Long value;

    private SearchId(Long value) {
        if (value == null) {
            throw new IllegalArgumentException("Search ID cannot be null");
        }
        this.value = value;
    }

    public static SearchId of(Long value) {
        return new SearchId(value);
    }

    public static SearchId generate() {
        return new SearchId(TsIdGenerator.next());
    }
}
