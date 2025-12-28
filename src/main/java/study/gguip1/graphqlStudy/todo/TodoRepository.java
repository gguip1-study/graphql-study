package study.gguip1.graphqlStudy.todo;

import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Repository
public class TodoRepository {

    private final Map<String, Todo> store = new ConcurrentHashMap<>();

    public List<Todo> findAll() {
        return store.values().stream()
                .sorted(Comparator.comparing(Todo::createdAt).reversed())
                .toList();
    }

    public Optional<Todo> findById(String id) {
        return Optional.ofNullable(store.get(id));
    }

    public Todo create(String title) {
        String id = UUID.randomUUID().toString();
        Todo todo = new Todo(id, title, false, Instant.now());
        store.put(id, todo);
        return todo;
    }

    public Todo save(Todo todo) {
        store.put(todo.id(), todo);
        return todo;
    }

    public boolean deleteById(String id) {
        return store.remove(id) != null;
    }
}
