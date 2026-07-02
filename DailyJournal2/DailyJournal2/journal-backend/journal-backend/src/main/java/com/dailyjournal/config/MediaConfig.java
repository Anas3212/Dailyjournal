package com.dailyjournal.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MediaConfig {

    @Value("${journal.media.max-files}")
    private int maxMediaFiles;

    public int getMaxMediaFiles() {
        return maxMediaFiles;
    }
}
