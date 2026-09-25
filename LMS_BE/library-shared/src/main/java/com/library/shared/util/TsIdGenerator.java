package com.library.shared.util;

import io.hypersistence.tsid.TSID;

public class TsIdGenerator {
    private TsIdGenerator(){}

    public static Long next() {
        return TSID.Factory.getTsid().toLong();
    }

    public static String nextString() {
        return TSID.Factory.getTsid().toString();
    }
}
