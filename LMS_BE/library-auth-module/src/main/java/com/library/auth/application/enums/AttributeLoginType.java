package com.library.auth.application.enums;

import lombok.Getter;

@Getter
public enum AttributeLoginType {
    GOOGLE("google","sub"),
    FACEBOOK("facebook", "id"),
    GITHUB("github", "login")
    ;

    private final String loginType;
    private final String sub;

    AttributeLoginType(String loginType, String sub) {
        this.loginType = loginType;
        this.sub = sub;
    }
}
