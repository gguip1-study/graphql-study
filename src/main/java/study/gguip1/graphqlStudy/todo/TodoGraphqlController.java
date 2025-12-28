package study.gguip1.graphqlStudy.todo;

import jakarta.validation.Valid;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import study.gguip1.graphqlStudy.todo.dto.CreateTodoInput;
import study.gguip1.graphqlStudy.todo.dto.UpdateTodoInput;

import java.util.List;

@Controller
public class TodoGraphqlController {

    private final TodoRepository repo;

    public TodoGraphqlController(TodoRepository repo) {
        this.repo = repo;
    }

    @QueryMapping
    public List<TodoView> todos() {
        return repo.findAll().stream().map(TodoView::from).toList();
    }

    @QueryMapping
    public TodoView todo(@Argument String id) {
        return repo.findById(id).map(TodoView::from).orElse(null);
    }

    @MutationMapping
    public TodoView createTodo(@Argument @Valid CreateTodoInput input) {
        return TodoView.from(repo.create(input.title()));
    }

    @MutationMapping
    public TodoView updateTodo(@Argument UpdateTodoInput input) {
        Todo existing = repo.findById(input.id())
                .orElseThrow(() -> new IllegalArgumentException("Todo not found: " + input.id()));

        String newTitle = (input.title() != null) ? input.title() : existing.title();
        boolean newDone = (input.done() != null) ? input.done() : existing.done();

        Todo updated = new Todo(existing.id(), newTitle, newDone, existing.createdAt());
        return TodoView.from(repo.save(updated));
    }

    @MutationMapping
    public boolean deleteTodo(@Argument String id) {
        return repo.deleteById(id);
    }
}
