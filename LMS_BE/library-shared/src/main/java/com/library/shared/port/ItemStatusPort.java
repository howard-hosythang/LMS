package com.library.shared.port;

public interface ItemStatusPort {
    ItemSnapshot lockAndGet(Long itemId);
    ItemSnapshot lockAndGetByBarcode(String barcode);
    void updateStatus(Long itemId, String status);
}
