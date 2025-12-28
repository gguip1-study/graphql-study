package study.gguip1.graphqlStudy.todo.dto;

public record UpdateTodoInput(
        String id,
        String title,
        Boolean done
) {}
