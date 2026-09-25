package com.library.catalog.domain.entities;

import com.library.catalog.domain.enums.ConditionItemEnum;
import com.library.catalog.domain.valueobject.Barcode;
import com.library.catalog.domain.valueobject.ItemId;
import com.library.catalog.domain.valueobject.LocationData;
import com.library.catalog.domain.valueobject.PublicationId;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Item {
    // Identity
    private final ItemId id;
    private final PublicationId publicationId;
    private final Barcode barcode;

    // Item properties
    private ItemStatus status;
    private LocationData location;
    private ConditionItemEnum condition;

    // Domain events
    private final List<Object> domainEvents = new ArrayList<>();

    public static Item create(PublicationId publicationId, Barcode barcode, ConditionItemEnum condition){
        return new Item(
            ItemId.generate(),
            publicationId,
            barcode,
            ItemStatus.AVAILABLE,
            null, // location can be set later
            condition
        );
    }

    public static Item of(ItemId itemId,PublicationId publicationId, Barcode barcode, ItemStatus status, LocationData location,
                          ConditionItemEnum condition){
        return new Item(
            itemId,
            publicationId,
            barcode,
            status,
            location,
            condition
        );
    }

    public List<Object> pollDomainEvents() {
        List<Object> events = new ArrayList<>(this.domainEvents);
        this.domainEvents.clear();
        return events;
    }

    private void addDomainEvent(Object event) {
        this.domainEvents.add(event);
    }
}
