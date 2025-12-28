package study.gguip1.graphqlStudy.todo.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateTodoInput(
        @NotBlank String title
) {}
