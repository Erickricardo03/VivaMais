package com.vivamais.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@Configuration
public class SpaWebFilter implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Cache imutável de longo prazo para bundles versionados e ativos estáticos
        registry.addResourceHandler("/assets/**", "/*.js", "/*.css", "/*.png", "/*.jpg", "/*.jpeg", "/*.svg", "/*.ico", "/*.woff", "/*.woff2")
                .addResourceLocations("classpath:/static/assets/", "classpath:/static/")
                .setCacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable());

        // Roteamento SPA fallback para index.html (sem cache para que atualizações entrem na hora)
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .setCacheControl(CacheControl.noCache().mustRevalidate())
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        // Não intercepta requisições de API REST ou console do H2
                        if (resourcePath.startsWith("api") || resourcePath.startsWith("h2-console")) {
                            return null;
                        }
                        Resource requestedResource = location.createRelative(resourcePath);
                        return (requestedResource.exists() && requestedResource.isReadable())
                                ? requestedResource
                                : location.createRelative("index.html");
                    }
                });
    }
}
