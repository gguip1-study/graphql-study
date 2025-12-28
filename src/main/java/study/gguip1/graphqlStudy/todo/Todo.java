package study.gguip1.graphqlStudy.todo;

import java.time.Instant;

public record Todo(
        String id,
        String title,
        boolean done,
        Instant createdAt
) {}
