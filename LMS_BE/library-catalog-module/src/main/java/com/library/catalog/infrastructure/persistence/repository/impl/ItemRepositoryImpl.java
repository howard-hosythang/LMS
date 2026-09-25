package com.library.catalog.infrastructure.persistence.repository.impl;

import com.library.catalog.domain.entities.ItemStatus;
import com.library.catalog.domain.enums.BindingType;
import com.library.catalog.domain.enums.ConditionItemEnum;
import com.library.catalog.domain.enums.CopyType;
import com.library.catalog.dto.request.item.ItemSearchRequest;
import com.library.catalog.dto.response.item.ItemDetailResponse;
import com.library.catalog.infrastructure.persistence.repository.ItemRepositoryCustom;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class ItemRepositoryImpl implements ItemRepositoryCustom {

    private final EntityManager em;

    @Override
    public Page<ItemDetailResponse> findAllItemWithFilter(ItemSearchRequest request, Pageable pageable) {
        StringBuilder where = new StringBuilder("WHERE 1=1 ");
        Map<String, Object> params = new LinkedHashMap<>();

        if (request.getKeyword() != null && !request.getKeyword().isBlank()) {
            where.append("AND (LOWER(i.barcode) LIKE LOWER(CONCAT('%', :keyword, '%')) ")
                 .append("OR LOWER(i.branch) LIKE LOWER(CONCAT('%', :keyword, '%')) ")
                 .append("OR LOWER(i.location) LIKE LOWER(CONCAT('%', :keyword, '%'))) ");
            params.put("keyword", request.getKeyword());
        }

        if (request.getStatus() != null) {
            where.append("AND i.status = :status ");
            params.put("status", request.getStatus().name());
        }

        if (request.getCondition() != null) {
            where.append("AND i.condition = :condition ");
            params.put("condition", request.getCondition().name());
        }

        String joins = "FROM items i JOIN publications p ON i.publication_id = p.id ";

        String dataSQL = "SELECT i.id, i.barcode, i.branch, i.location, i.status, i.condition, p.title, "
                + "i.copy_type, i.binding_type, i.condition_note, i.acquired_date, i.acquisition_source "
                + joins + where;

        String countSQL = "SELECT COUNT(*) " + joins + where;

        // Append Sorting
        String orderBy = "ORDER BY i.created_at DESC"; // default
        if (pageable.getSort().isSorted()) {
            StringBuilder sb = new StringBuilder("ORDER BY ");
            pageable.getSort().forEach(order -> {
                String property = order.getProperty();
                String direction = order.getDirection().name();
                String column = switch (property) {
                    case "barcode" -> "i.barcode";
                    case "branch" -> "i.branch";
                    case "location" -> "i.location";
                    case "status" -> "i.status";
                    case "condition" -> "i.condition";
                    case "publicationTitle" -> "p.title";
                    case "createdAt" -> "i.created_at";
                    default -> "i.created_at";
                };
                sb.append(column).append(" ").append(direction).append(", ");
            });
            orderBy = sb.substring(0, sb.length() - 2);
        }

        dataSQL += " " + orderBy;

        Query dataQuery = em.createNativeQuery(dataSQL)
                .setFirstResult((int) pageable.getOffset())
                .setMaxResults(pageable.getPageSize());

        Query countQuery = em.createNativeQuery(countSQL);

        params.forEach((k, v) -> {
            dataQuery.setParameter(k, v);
            countQuery.setParameter(k, v);
        });

        List<Object[]> rows = dataQuery.getResultList();
        long total = ((Number) countQuery.getSingleResult()).longValue();

        List<ItemDetailResponse> content = rows.stream()
                .map(this::mapRow)
                .toList();

        return new PageImpl<>(content, pageable, total);
    }

    private ItemDetailResponse mapRow(Object[] row) {
        return ItemDetailResponse.builder()
                .id(((Number) row[0]).longValue())
                .barcode((String) row[1])
                .branch((String) row[2])
                .location((String) row[3])
                .status(ItemStatus.valueOf((String) row[4]))
                .condition(row[5] != null ? ConditionItemEnum.valueOf((String) row[5]) : null)
                .publicationTitle((String) row[6])
                .copyType(row[7] != null ? CopyType.valueOf((String) row[7]) : null)
                .bindingType(row[8] != null ? BindingType.valueOf((String) row[8]) : null)
                .conditionNote((String) row[9])
                .acquiredDate(row[10] instanceof java.sql.Date date ? date.toLocalDate()
                        : row[10] instanceof java.time.LocalDate localDate ? localDate : null)
                .acquisitionSource((String) row[11])
                .build();
    }
}
