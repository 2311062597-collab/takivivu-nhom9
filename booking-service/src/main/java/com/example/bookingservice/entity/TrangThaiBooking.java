package com.example.bookingservice.entity;

public enum TrangThaiBooking {

    PENDING_PAYMENT,
    PAYMENT_RECEIVED,
    PAID,
    CONFIRMED,
    COMPLETED,

    PAYMENT_FAILED,
    EXPIRED,
    CANCELLED,

    CANCEL_REQUESTED,
    REFUND_PENDING,
    REFUNDED
}