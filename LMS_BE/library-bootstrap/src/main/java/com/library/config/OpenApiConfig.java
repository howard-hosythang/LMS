package com.library.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI libraryOpenAPI() {
        Server localServer = new Server();
        localServer.setUrl("http://localhost:8080");
        localServer.setDescription("Local server");
        // 2. Cấu hình Info (Thông tin đồ án)
        Info info = new Info()
                .title("Library Management System API")
                .version("1.0.0")
                .contact(new Contact()
                        .name("Võ Quang Thắng")
                        .email("thang.vokhmt04k22@hcmut.edu.vn")
                        .url("https://github.com/quangthangk4"))
                .description("API documentation for Library Management System (Final Year Project)")
                .license(new License().name("Apache 2.0").url("http://springdoc.org"));

        // 3. Cấu hình Security (Quan trọng: Để test được API cần Login)
        String securitySchemeName = "bearerAuth";
        SecurityRequirement securityRequirement = new SecurityRequirement().addList(securitySchemeName);

        Components components = new Components().addSecuritySchemes(securitySchemeName,
                new SecurityScheme()
                        .name(securitySchemeName)
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT"));

        return new OpenAPI()
                .info(info)
                .servers(List.of(localServer))
                .addSecurityItem(securityRequirement)
                .components(components);
    }


}
