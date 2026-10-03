package com.library.integration;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.circulation.application.deposit.BorrowDepositService;
import com.library.circulation.application.deposit.DepositPaymentOrderStore;
import com.library.circulation.application.deposit.DepositPaymentService;
import com.library.circulation.application.policy.CirculationPolicy;
import com.library.circulation.application.policy.CirculationPolicyService;
import com.library.circulation.dto.request.DepositPaymentRequest;
import com.library.circulation.infrastructure.payment.PayOsClient;
import com.library.shared.service.AuditLogService;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/** Uses an isolated disposable database ONLY; no LMS operational DB or live payOS calls. */
@Testcontainers(disabledWithoutDocker = true)
class DepositPaymentSqlIntegrationTest {
    @Container static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");
    static JdbcTemplate jdbc;
    static NamedParameterJdbcTemplate named;
    static TransactionTemplate tx;
    DepositPaymentOrderStore store;
    DepositPaymentService service;
    BorrowDepositService deposits;
    PayOsClient provider;
    static final DepositPaymentRequest REQUEST = new DepositPaymentRequest("DIRECT", "00123", "BC1", null);

    @BeforeAll static void schema() throws Exception {
        var ds=new DriverManagerDataSource(postgres.getJdbcUrl(),postgres.getUsername(),postgres.getPassword());
        jdbc=new JdbcTemplate(ds); named=new NamedParameterJdbcTemplate(ds); tx=new TransactionTemplate(new DataSourceTransactionManager(ds));
        jdbc.execute("CREATE TABLE users(id BIGINT PRIMARY KEY,student_id TEXT,full_name TEXT,status TEXT)");
        jdbc.execute("CREATE TABLE publications(id BIGINT PRIMARY KEY,title TEXT)");
        jdbc.execute("CREATE TABLE items(id BIGINT PRIMARY KEY,publication_id BIGINT REFERENCES publications(id),barcode TEXT,status TEXT)");
        jdbc.execute("CREATE TABLE circulation_policies(id BIGINT PRIMARY KEY)");
        jdbc.execute("CREATE TABLE borrowing_transactions(id BIGINT PRIMARY KEY,user_id BIGINT REFERENCES users(id),item_id BIGINT REFERENCES items(id),status TEXT,picked_up_deadline TIMESTAMPTZ)");
        jdbc.execute("CREATE TABLE reservations(id BIGINT PRIMARY KEY,user_id BIGINT,assigned_item_id BIGINT,publication_id BIGINT,status TEXT,hold_expiration_time TIMESTAMPTZ)");
        jdbc.execute("CREATE TABLE fines(id BIGINT PRIMARY KEY,transaction_id BIGINT,payment_status TEXT,fine_amount NUMERIC,created_at TIMESTAMPTZ)");
        for (String name : new String[]{"V47__borrow_deposit_accounting.sql", "V60__deposit_payment_method.sql", "V61__deposit_payos_orders.sql"}) {
            // Send full scripts to PostgreSQL so DO $$ blocks are parsed by PostgreSQL, not split on inner semicolons.
            try (var stream=new ClassPathResource("db/migration/"+name).getInputStream()) {
                jdbc.execute(new String(stream.readAllBytes(),StandardCharsets.UTF_8));
            }
        }
        jdbc.update("INSERT INTO users VALUES(7,'00123','Reader','ACTIVE'),(9,'LIB9','Librarian','ACTIVE')");
        jdbc.update("INSERT INTO publications VALUES(2,'Book'); INSERT INTO items VALUES(1,2,'BC1','AVAILABLE')");
    }
    @BeforeEach void setup() {
        // These tables exist only in the disposable container created above.
        jdbc.update("DELETE FROM deposit_payment_orders"); jdbc.update("DELETE FROM borrow_deposit_events"); jdbc.update("DELETE FROM borrowing_transactions");
        var policies=mock(CirculationPolicyService.class);
        when(policies.getPolicy()).thenReturn(new CirculationPolicy(48,14,5,3,1,2,BigDecimal.TEN,new BigDecimal("50000"),false,null,null,null));
        store=new DepositPaymentOrderStore(named,policies); provider=mock(PayOsClient.class);
        var audit=mock(AuditLogService.class);
        service=new DepositPaymentService(store,named,provider,audit,new ObjectMapper()); deposits=new BorrowDepositService(named,audit);
    }
    Long prepare() { return tx.execute(status -> DepositPaymentOrderStore.number(store.prepare(REQUEST,9L),"order_code")); }
    void pay(Long code) {
        jdbc.update("UPDATE deposit_payment_orders SET status='PENDING',payment_link_id='link',checkout_url='https://pay.payos.vn/web/link',qr_code='qr' WHERE order_code=?",code);
        when(provider.getPaymentDetails(code)).thenReturn(new PayOsClient.PayOsPaymentDetails(code,"link",50000,"PAID",50000,null,null));
        tx.execute(status -> service.sync(code,9L));
    }
    @Test void migrationsAndQueriesReuseDurableOrderAndEnforceUniqueOpenTarget() {
        Long code=prepare();
        assertThat(code).isLessThanOrEqualTo(9007199254740991L);
        assertThat(prepare()).isEqualTo(code);
        assertThat(jdbc.queryForObject("SELECT status FROM deposit_payment_orders WHERE order_code=?",String.class,code)).isEqualTo("CREATING");
        assertThatThrownBy(() -> jdbc.update("""
            INSERT INTO deposit_payment_orders(id,order_code,user_id,item_id,flow,amount,description,status)
            VALUES(999,999,7,1,'DIRECT',50000,'COC999999','PENDING')
            """)).isInstanceOf(DataIntegrityViolationException.class);
    }
    @Test void handoverFailureRollsBackConsumptionAndCollectionThenRetryCollectsOnlyOnce() {
        Long code=prepare(); pay(code);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM borrow_deposit_events",Long.class)).isZero();
        assertThatThrownBy(() -> tx.execute(status -> {
            jdbc.update("INSERT INTO borrowing_transactions(id,user_id,item_id,status) VALUES(10,7,1,'BORROWING')");
            var amount=service.resolveForHandover("BANK_TRANSFER",code,"DIRECT",null,10L,7L,1L,new BigDecimal("60000"),9L);
            deposits.collectForBorrow(10L,9L,amount,"BANK_TRANSFER");
            throw new IllegalStateException("Simulated handover failure");
        })).isInstanceOf(IllegalStateException.class);
        assertThat(jdbc.queryForObject("SELECT status FROM deposit_payment_orders WHERE order_code=?",String.class,code)).isEqualTo("PAID");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM borrow_deposit_events",Long.class)).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM borrowing_transactions",Long.class)).isZero();
        tx.execute(status -> {
            jdbc.update("INSERT INTO borrowing_transactions(id,user_id,item_id,status) VALUES(11,7,1,'BORROWING')");
            var amount=service.resolveForHandover("BANK_TRANSFER",code,"DIRECT",null,11L,7L,1L,new BigDecimal("60000"),9L);
            deposits.collectForBorrow(11L,9L,amount,"BANK_TRANSFER"); return null;
        });
        assertThat(jdbc.queryForObject("SELECT status FROM deposit_payment_orders WHERE order_code=?",String.class,code)).isEqualTo("CONSUMED");
        assertThat(jdbc.queryForObject("SELECT consumed_transaction_id FROM deposit_payment_orders WHERE order_code=?",Long.class,code)).isEqualTo(11L);
        assertThat(jdbc.queryForObject("SELECT deposit_amount FROM borrowing_transactions WHERE id=11",BigDecimal.class)).isEqualByComparingTo("50000");
        assertThat(jdbc.queryForObject("SELECT payment_method FROM borrow_deposit_events WHERE transaction_id=11",String.class)).isEqualTo("BANK_TRANSFER");
        assertThatThrownBy(() -> tx.execute(status -> service.resolveForHandover("BANK_TRANSFER",code,"DIRECT",null,11L,7L,1L,BigDecimal.TEN,9L)))
            .isInstanceOf(ResponseStatusException.class);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM borrow_deposit_events",Long.class)).isEqualTo(1L);
    }
    @Test void pendingOrderCannotBeConsumedAndZeroPolicyCannotBypassExistingPaidFunds() {
        Long code=prepare();
        assertThatThrownBy(() -> tx.execute(status -> service.resolveForHandover("BANK_TRANSFER",code,"DIRECT",null,10L,7L,1L,BigDecimal.TEN,9L)))
            .isInstanceOf(ResponseStatusException.class);
        pay(code);
        assertThatThrownBy(() -> tx.execute(status -> service.resolveForHandover("BANK_TRANSFER",null,"DIRECT",null,10L,7L,1L,BigDecimal.ZERO,9L)))
            .isInstanceOf(ResponseStatusException.class);
        assertThat(jdbc.queryForObject("SELECT status FROM deposit_payment_orders WHERE order_code=?",String.class,code)).isEqualTo("PAID");
    }
}
