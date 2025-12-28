package study.gguip1.graphqlStudy.todo;

public record TodoView(
        String id,
        String title,
        boolean done,
        String createdAt
) {
    static TodoView from(Todo todo) {
        return new TodoView(
                todo.id(),
                todo.title(),
                todo.done(),
                todo.createdAt().toString()
        );
    }
}
