package com.library.integration;

import static org.assertj.core.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.recommendation.application.chatbot.ChatbotTool;
import com.library.recommendation.infrastructure.persistence.ChatbotReadQueries;
import java.util.List;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.postgresql.ds.PGSimpleDataSource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

/** Runs migrations and actual SELECTs in a disposable pgvector database, without the application/external services. */
@Testcontainers
class ChatbotReadOnlyIntegrationTest {
    @Container static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(
        DockerImageName.parse("pgvector/pgvector:pg15").asCompatibleSubstituteFor("postgres"));
    static JdbcTemplate jdbc;
    static ChatbotReadQueries queries;
    static TransactionTemplate transaction;
    static final ObjectMapper mapper = new ObjectMapper();

    @BeforeAll static void setup() {
        var source = new PGSimpleDataSource();
        source.setURL(postgres.getJdbcUrl()); source.setUser(postgres.getUsername()); source.setPassword(postgres.getPassword());
        Flyway.configure().dataSource(source).locations("classpath:db/migration").load().migrate();
        jdbc = new JdbcTemplate(source);
        queries = new ChatbotReadQueries(new NamedParameterJdbcTemplate(source));
        transaction = new TransactionTemplate(new DataSourceTransactionManager(source));
        transaction.setReadOnly(true);
    }

    @Test void catalogPolicyAndPersonalToolsUseRealSqlWithoutChangingBusinessTables() throws Exception {
        Long userId = jdbc.queryForObject("SELECT user_id FROM borrowing_transactions ORDER BY id LIMIT 1", Long.class);
        long viewsBefore = jdbc.queryForObject("SELECT COUNT(*) FROM user_interactions", Long.class);
        long notificationsBefore = jdbc.queryForObject("SELECT COUNT(*) FROM user_notifications WHERE is_read", Long.class);
        for (var tool : ChatbotTool.values()) {
            if (tool == ChatbotTool.search_library_help) continue;
            var arguments = mapper.createObjectNode();
            if (List.of(ChatbotTool.search_catalog, ChatbotTool.get_publication_details, ChatbotTool.get_publication_availability, ChatbotTool.get_publication_rating_summary).contains(tool)) {
                arguments.put("publicationId", jdbc.queryForObject("SELECT MIN(id)::text FROM publications", String.class));
                if (!tool.arguments.contains("publicationId")) { arguments.remove("publicationId"); arguments.put("query", "Code"); }
            }
            var reply = transaction.execute(status -> queries.execute(tool, arguments, tool.personal ? userId : null, "en"));
            assertThat(reply).isNotNull();
            assertThat(reply.status()).isEqualTo("ANSWERED");
        }
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM user_interactions", Long.class)).isEqualTo(viewsBefore);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM user_notifications WHERE is_read", Long.class)).isEqualTo(notificationsBefore);
    }

    @Test void fineAggregateAndLoansAreScopedToTheSelectedReaderAcrossPages() throws Exception {
        Long userId = jdbc.queryForObject("SELECT user_id FROM borrowing_transactions ORDER BY id LIMIT 1", Long.class);
        var reply = transaction.execute(status -> queries.execute(ChatbotTool.get_my_fines, mapper.createObjectNode(), userId, "vi"));
        Long count = jdbc.queryForObject("SELECT COUNT(*) FROM fines f JOIN borrowing_transactions t ON t.id=f.transaction_id WHERE t.user_id=? AND f.payment_status='UNPAID'", Long.class, userId);
        assertThat(reply.total()).isEqualTo(count);
        var other = transaction.execute(status -> queries.execute(ChatbotTool.get_my_loans, mapper.createObjectNode(), Long.MAX_VALUE, "vi"));
        assertThat(other.total()).isZero();
        assertThat(other.cards()).isEmpty();
    }
}
