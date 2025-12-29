# GraphQL Study

Spring Boot에서 GraphQL을 사용하는 방법을 학습하기 위한 프로젝트입니다.

## 학습 목표

REST API 대신 GraphQL을 사용했을 때의 차이점과 Spring GraphQL의 사용법을 익힙니다.

## 학습 내용

### 1. GraphQL 스키마 정의

`resources/graphql/schema.graphqls` 파일에 스키마를 정의합니다.

```graphql
type Todo {
    id: ID!
    title: String!
    done: Boolean!
    createdAt: String!
}

type Query {
    todos: [Todo!]!        # 전체 조회
    todo(id: ID!): Todo    # 단건 조회
}

type Mutation {
    createTodo(input: CreateTodoInput!): Todo!
    updateTodo(input: UpdateTodoInput!): Todo!
    deleteTodo(id: ID!): Boolean!
}
```

- `!`는 non-null을 의미
- `Query`는 조회, `Mutation`은 데이터 변경
- `input` 타입으로 복잡한 입력값 구조화

### 2. 리졸버 구현 (@QueryMapping, @MutationMapping)

스키마에 정의한 Query/Mutation을 실제로 처리하는 메서드입니다.

```java
@Controller
public class TodoGraphqlController {

    @QueryMapping
    public List<TodoView> todos() {
        return repo.findAll().stream().map(TodoView::from).toList();
    }

    @MutationMapping
    public TodoView createTodo(@Argument @Valid CreateTodoInput input) {
        return TodoView.from(repo.create(input.title()));
    }
}
```

- `@QueryMapping`: 스키마의 Query 필드와 자동 매핑
- `@MutationMapping`: 스키마의 Mutation 필드와 자동 매핑
- `@Argument`: GraphQL 인자를 파라미터로 바인딩

### 3. Input 타입 활용

GraphQL의 input 타입을 Java Record로 매핑합니다.

```java
public record CreateTodoInput(
    @NotBlank String title
) {}

public record UpdateTodoInput(
    String id,
    String title,
    Boolean done
) {}
```

- `@Valid`와 함께 사용하면 입력값 검증 가능
- Record를 사용하면 불변 객체로 간결하게 표현

### 4. GraphQL 에러 처리

`@GraphQlExceptionHandler`로 예외를 GraphQL 에러 응답으로 변환합니다.

```java
@ControllerAdvice
public class GraphQlExceptionAdvice {

    @GraphQlExceptionHandler(IllegalArgumentException.class)
    public GraphQLError handleIllegalArgument(IllegalArgumentException ex, DataFetchingEnvironment env) {
        return GraphqlErrorBuilder.newError(env)
                .errorType(ErrorType.BAD_REQUEST)
                .message(ex.getMessage())
                .build();
    }
}
```

### 5. 클라이언트에서 GraphQL 호출

fetch API로 `/graphql` 엔드포인트에 POST 요청을 보냅니다.

```javascript
async function graphql(query, variables = {}) {
    const res = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables })
    });
    return res.json();
}

// 사용 예시
const { data } = await graphql(`
    mutation ($input: CreateTodoInput!) {
        createTodo(input: $input) { id title done }
    }
`, { input: { title: "할일" } });
```

## REST vs GraphQL 비교

### REST 장점
- HTTP 캐싱 활용 용이 (GET 요청 캐싱)
- 단순하고 직관적인 구조
- 브라우저에서 바로 테스트 가능
- 파일 업로드가 간단함
- 에러 처리가 HTTP 상태 코드로 명확함

### REST 단점
- Over-fetching: 필요 없는 데이터까지 받아옴
- Under-fetching: 여러 엔드포인트를 호출해야 하는 경우 발생
- API 버전 관리 필요 (v1, v2...)

### GraphQL 장점
- 필요한 필드만 선택해서 요청 가능
- 단일 엔드포인트로 다양한 요청 처리
- 스키마로 타입 시스템 내장
- API 문서가 스키마로 자동 생성

### GraphQL 단점
- HTTP 캐싱 어려움 (모든 요청이 POST)
- 파일 업로드 복잡함 (별도 스펙 필요)
- 단순 CRUD에는 오버엔지니어링일 수 있음
- 학습 곡선 존재 (스키마, 리졸버 개념)
- N+1 문제 발생 가능 (DataLoader로 해결)

### 언제 뭘 쓸까?
- **REST**: 단순한 CRUD, 캐싱이 중요한 경우, 빠른 개발
- **GraphQL**: 복잡한 데이터 관계, 다양한 클라이언트(웹/앱), 프론트엔드 자율성 필요

## 실행 방법

```bash
./gradlew bootRun
```

- Todo 앱: http://localhost:8080
- GraphiQL: http://localhost:8080/graphiql (쿼리 테스트용 IDE)

## 사용 기술

- Java 21
- Spring Boot 3.5.9
- Spring GraphQL
