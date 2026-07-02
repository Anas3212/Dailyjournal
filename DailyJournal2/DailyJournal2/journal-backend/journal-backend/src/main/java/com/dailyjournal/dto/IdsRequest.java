package com.dailyjournal.dto;

import lombok.Data;

import java.util.List;

@Data
public class IdsRequest {
    private List<Long> ids;
}
